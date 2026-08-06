"use client"

import React, { useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

export function PayPalCheckoutButton() {
  const [internalTxId, setInternalTxId] = useState<string | null>(null)

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: "USD",
    intent: "capture",
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="w-full max-w-xs mx-auto">
        <PayPalButtons 
          style={{ layout: "vertical", color: "gold", shape: "pill" }}
          createOrder={async () => {
            // 1. Створюємо транзакцію на нашому бекенді
            const res = await fetch("/api/payments/paypal/create-order", {
              method: "POST"
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            
            setInternalTxId(data.transactionId)

            // Повертаємо суму для PayPal SDK (наприклад, $1.00)
            return data.transactionId // або можемо передати суму напряму
          }}
          // Передаємо вартість купленого товару напряму у виклику створення ордера PayPal
          createOrderHandler={(data, actions) => {
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: "USD",
                    value: "0.25", // Ціна енергії в USD
                  },
                  description: "Energy Potion - LifeMMO",
                },
              ],
            })
          }}
          onApprove={async (data, actions) => {
            if (!actions.order) return
            const details = await actions.order.capture()

            // 2. Підтверджуємо успішну оплату на нашому бекенді
            if (internalTxId) {
              await fetch("/api/payments/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionId: internalTxId })
              })
              
              alert(`Thank you, ${details.payer.name?.given_name || 'Hero'}! Energy restored. ⚡`)
              window.location.reload()
            }
          }}
          onError={(err) => {
            console.error("PayPal Checkout Error:", err)
            alert("Payment failed. Please try again.")
          }}
        />
      </div>
    </PayPalScriptProvider>
  )
}