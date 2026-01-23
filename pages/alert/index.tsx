import React, { useState, useEffect } from "react"
import { Button, Column, styled, Text, useControlTheme } from 'components/ui-blocks'
import Image from 'next/image'

const FlowAlert = () => {
  const [email, setEmail] = useState("")
  const [type, setType] = useState("all")
  const [flowID, setFlowID] = useState<string | null>(null)
  const [owner, setOwner] = useState<string | null>(null)
  const [derivedAddress, setDerivedAddress] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  const themeController = useControlTheme()


  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setFlowID(params.get("flowID"))
    setOwner(params.get("owner"))
    setDerivedAddress(params.get("derivedAddress"))
    setImageUrl(params.get("imageUrl"))
    const themeParam = params.get("theme")
    if (themeParam === "light") {
      setTheme(themeParam)
      themeController.toggle()
    }
  }, [theme, themeController])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || (!flowID && !owner)) {
      alert("Please provide a valid email and either a flow ID or owner.")
      return
    }

    const response = await fetch("/.netlify/functions/flow-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, flowID, owner, type }),
    })

    if (response.ok) {
      setSubmitted(true)
      setEmail("")
    } else {
      alert("Failed to subscribe. Please try again.")
    }
  }

  const inputStyles = {
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    outline: 'none',
    transition: 'border-color 0.3s ease-in-out',
    backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    borderColor: theme === "dark" ? "#444" : "#ccc",
  }

  return (
    <StyledWrapper>
      <Column align="center" justifyContent="center" style={{ minHeight: '100vh', padding: '16px' }}>
        <Text variant="header" align="center" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          {owner
            ? `Subscribe to Alerts`
            : `Subscribe to Flow Alerts for Flow ${flowID}`}
        </Text>
        <Text align="center" style={{ fontSize: '12px', marginBottom: '16px' }}>
          {owner && `For flow owner ${owner}`}
          {derivedAddress && ", which is a derived address from the actual sender on the source chain"}
        </Text>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '480px' }}>
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyles}
            required
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={inputStyles}
          >
            <option value="triggered">Triggered</option>
            <option value="timeout">Timed Out</option>
            <option value="error">Errors</option>
            <option value="all">All Events</option>
          </select>

          <Button
            type="submit"
            variant="primary"
            style={{
              padding: '12px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '8px',
            }}
          >
            {submitted ? "Subscribed!" : "Subscribe"}
          </Button>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Image
              src={imageUrl || "https://intento.zone/assets/images/intento_tiny.png"}
              alt="Custom or Default Logo"
              width={230}
              height={40}
            />
          </div>

          <Text variant="caption" align="center" style={{ marginTop: '16px' }}>
            You’ll receive alerts for matching events. Emails are used solely for flow notifications. The notification system is managed by TRST Labs.
          </Text>
        </form>
      </Column>
    </StyledWrapper>
  )
}

export default FlowAlert




const StyledWrapper = styled('div', {

  backgroundColor: '$backgroundColors$base',

})