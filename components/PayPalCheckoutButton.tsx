"use client"

import React, { useState } from "react"
import { PayPalScriptProvider, PayPalButtons, FUNDING } from "@paypal/react-paypal-js"

export function PayPalCheckoutButton() {
  const [internalTxId, setInternalTxId] = useState<string | null>(null)

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: "USD",
    intent: "capture",
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="flex flex-col items-center w-full max-w-[200px] mx-auto gap-2 z-20">
        
        {/* Наш кастомний текст із ціною, оскільки PayPal не пише її на кнопці */}
        <div className="font-pixel text-[9px] uppercase text-gold bg-black/50 px-3 py-1.5 rounded border border-gold/30">
          Restore ⚡ ($0.25)
        </div>

        <div className="w-full relative z-30">
          <PayPalButtons 
            // ПРИМУСОВО залишаємо ТІЛЬКИ кнопку PayPal. Це прибере потворну кнопку картки, яка ламає дизайн
            fundingSource={FUNDING.PAYPAL} 
            style={{ 
              layout: "vertical", 
              color: "gold", 
              shape: "rect",
              height: 35 // Робимо її тоншою, щоб краще вписувалась у ретро-стиль
            }}
            createOrder={async (data, actions) => {
              try {
                // 1. Реєструємо транзакцію в нашій базі (на 25 центів)
                const res = await fetch("/api/payments/paypal/create-order", {
                  method: "POST"
                })
                const dbData = await res.json()
                
                if (!res.ok) throw new Error(dbData.error)
                setInternalTxId(dbData.transactionId)

                // 2. Створюємо ордер САМЕ для PayPal і повертаємо його ID
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      reference_id: dbData.transactionId, // Прив'язуємо нашу транзакцію
                      amount: {
                        currency_code: "USD",
                        value: "0.25", // ВАЖЛИВО: Ціна для PayPal ($0.25)
                      },
                      description: "Energy Potion - LifeMMO",
                    },
                  ],
                })
              } catch (err) {
                console.error("Order creation failed", err)
                throw err
              }
            }}
            onApprove={async (data, actions) => {
              if (!actions.order) return
              
              // 3. Знімаємо гроші (Capture)
              const details = await actions.order.capture()

              // 4. Кажемо нашому бекенду, що все успішно
              if (internalTxId) {
                await fetch("/api/payments/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ transactionId: internalTxId })
                })
                
                alert(`Payment successful! Energy restored. ⚡`)
                window.location.reload()
              }
            }}
            onError={(err) => {
              console.error("PayPal Checkout Error:", err)
              alert("Payment failed or was closed. Please try again.")
            }}
          />
        </div>
      </div>
    </PayPalScriptProvider>
  )
}