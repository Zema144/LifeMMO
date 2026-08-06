"use client"

import React, { useState } from "react"
import { PayPalScriptProvider, PayPalButtons, FUNDING } from "@paypal/react-paypal-js"

// Додаємо інтерфейс для пропсів
interface PayPalCheckoutButtonProps {
  onSuccess: () => void;
}

export function PayPalCheckoutButton({ onSuccess }: PayPalCheckoutButtonProps) {
  const [internalTxId, setInternalTxId] = useState<string | null>(null)

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: "USD",
    intent: "capture",
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="flex flex-col items-center w-full max-w-[200px] mx-auto gap-2 z-20">
        
        <div className="font-pixel text-[9px] uppercase text-gold bg-black/50 px-3 py-1.5 rounded border border-gold/30">
          Restore ⚡ ($0.25)
        </div>

        <div className="w-full relative z-30">
          <PayPalButtons 
            fundingSource={FUNDING.PAYPAL} 
            style={{ 
              layout: "vertical", 
              color: "gold", 
              shape: "rect",
              height: 35
            }}
            createOrder={async (data, actions) => {
              try {
                const res = await fetch("/api/payments/paypal/create-order", { method: "POST" })
                const dbData = await res.json()
                
                if (!res.ok) throw new Error(dbData.error)
                setInternalTxId(dbData.transactionId)

                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [{
                    reference_id: dbData.transactionId,
                    amount: { currency_code: "USD", value: "0.25" },
                    description: "Energy Potion - LifeMMO",
                  }],
                })
              } catch (err) {
                console.error("Order creation failed", err)
                throw err
              }
            }}
            onApprove={async (data, actions) => {
              if (!actions.order) return
              
              await actions.order.capture()

              if (internalTxId) {
                await fetch("/api/payments/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ transactionId: internalTxId })
                })
                
                // Викликаємо функцію замість перезавантаження!
                onSuccess()
              }
            }}
            onError={(err) => {
              console.error("PayPal Checkout Error:", err)
            }}
          />
        </div>
      </div>
    </PayPalScriptProvider>
  )
}