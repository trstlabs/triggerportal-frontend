import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Column, styled, Text, useControlTheme } from 'components/ui-blocks'
import { useChain } from '@interchain-kit/react'
import { useAtom } from 'jotai'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { WalletButton } from '../../components/Wallet/WalletButton'
import { useAfterConnectWallet } from '../../hooks/useAfterConnectWallet'

import { PreviewAndSubmit } from '../../features/build/components/PreviewAndSubmit'
import { FlowInput as FlowInputType } from '../../types/trstTypes'

const StyledWrapper = styled('div', {
  minHeight: '100vh',
  width: '100%',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '& > div': {
    zoom: 0.7,
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    boxSizing: 'border-box',
    '@media (max-width: 992px)': {
      zoom: 0.8,
      padding: '15px',
    },
    '@media (max-width: 768px)': {
      padding: '10px',
    },
    '@media (max-width: 480px)': {
      padding: '5px',
    }
  }
})

export default function Submit() {
  const router = useRouter()
  const [flowInput, setFlowInput] = useState<FlowInputType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [imageUrl, setImageUrl] = useState<string | null>("https://intento.zone/assets/images/intento_tiny.png")
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [chainId, setChainId] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState<string>("#2a3f5a") // Default warm blueish-gray

  const themeController = useControlTheme()

  // Set theme based on URL parameter or default to dark
  useEffect(() => {
    const urlTheme = router.query.theme as string | undefined
    const isLightTheme = urlTheme === 'light'

    // Only update if there's a change
    if ((isLightTheme && theme !== 'light') || (!isLightTheme && theme !== 'dark')) {
      if (isLightTheme) {
        themeController.setLightTheme(true)
        setTheme('light')
      } else {
        themeController.setDarkTheme(true)
        setTheme('dark')
      }
    }
    // Remove themeController from dependencies to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.theme, theme])

  // Check screen size
  const [isSmallOrMediumScreen, setIsSmallOrMediumScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      // Tailwind's 'sm' breakpoint is 640px, 'md' is 768px
      const isSmall = window.matchMedia('(max-width: 900px)').matches
      setIsSmallOrMediumScreen(isSmall)
    }

    // Initial check
    checkScreenSize()

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize)

    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Wallet connection state and functions
  const [{ status }, setWalletState] = useAtom(walletState)

  let {
    // isWalletConnected, // Removed as it does not exist
    status: chainStatus, // Renamed to avoid partial conflict if any
    connect,
    disconnect,
    username,
    address,
    openView
  } = useChain(process.env.NEXT_PUBLIC_INTO_REGISTRY_NAME)

  // Watch for address changes and trigger the mutation
  const { mutate: afterConnectWallet = () => { } } = useAfterConnectWallet() || {}

  useEffect(() => {
    if (address) {
      afterConnectWallet(null)
    }
  }, [address, afterConnectWallet])

  const walletStatusesConnected = (chainStatus === 'Connected') && (status === WalletStatusType.connected || status === WalletStatusType.restored)
  const isClientConnected = true // Simplified for this implementation

  function resetWalletConnection() {
    disconnect()
    setWalletState({
      status: WalletStatusType.idle,
      address: '',
      key: null,
      client: null
    })
  }

  async function connectWallet() {
    await connect()
    let attempts = 0

    while (status !== WalletStatusType.connecting && attempts < 3) {
      if (isClientConnected) {
        attempts = attempts + 3
      }

      afterConnectWallet(null)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      attempts++
    }
  }

  useEffect(() => {
    // Check for theme parameter in URL
    const params = new URLSearchParams(window.location.search)


    // Get imageUrl parameter
    const imageUrlParam = params.get("imageUrl")
    if (imageUrlParam) {
      setImageUrl(imageUrlParam)
    }

    // Get chain parameter
    const chainParam = params.get("chain")
    if (chainParam) {
      setChainId(chainParam)
      // console.log('Chain parameter detected:', chainParam)
    }

    // Get background color parameter with fallback to URL hash
    let bgColorParam = params.get("bgColor") || '';

    // If empty, try to get from URL hash
    if (!bgColorParam && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#')) {
        bgColorParam = hash.substring(1); // Remove the #
        //console.log('Using color from URL hash:', bgColorParam);
      }
    }

    // Process the color if we have a value
    if (bgColorParam) {
      // Clean the input
      let cleanColor = bgColorParam.trim();

      // Remove any trailing = signs and spaces
      cleanColor = cleanColor.replace(/[= ]+$/, '');

      // Remove any # characters and add a single one at the start
      cleanColor = cleanColor.replace(/#/g, '');
      cleanColor = `#${cleanColor}`;

      // Validate hex color (3 or 6 digits after #)
      if (/^#(?:[0-9a-f]{3}){1,2}$/i.test(cleanColor)) {
        // console.log('Setting background color to:', cleanColor);
        setBgColor(cleanColor);
      } else {
        console.warn('Invalid hex color format. Expected #RGB or #RRGGBB. Got:', cleanColor);
        // Set a default color if needed
        // setBgColor('#000000'); // Uncomment and set your default color if desired
      }
    }

    const themeParam = params.get("theme")
    if (themeParam === "light") {
      setTheme(themeParam)
      themeController.toggle()
    }
  }, [theme, themeController])

  useEffect(() => {
    const fetchFlowInput = async () => {
      try {
        if (!router.isReady) {
          console.log('Router not ready yet');
          return;
        }

        const flowInputDataRaw = router.query.flowInput;
        console.log('Raw flow input data:', flowInputDataRaw);

        if (!flowInputDataRaw) {
          console.log('No flow input data in URL');
          return;
        }

        if (typeof flowInputDataRaw !== 'string') {
          console.error('Flow input data is not a string:', flowInputDataRaw);
          throw new Error('Invalid flow input data format');
        }

        try {
          // Parse the flow input data from URL parameter
          const decodedData = decodeURIComponent(flowInputDataRaw);
          console.log('Decoded data:', decodedData);

          if (!decodedData) {
            throw new Error('Decoded data is empty');
          }

          const parsedData = JSON.parse(decodedData);
          console.log('Parsed data:', parsedData);

          if (!parsedData) {
            throw new Error('Parsed data is null');
          }

          // Ensure all required fields are present with default values
          const flowInputData: FlowInputType = {
            msgs: parsedData?.msgs || [],
            duration: parsedData?.duration || undefined,
            label: parsedData?.label || '',
            interval: parsedData?.interval || undefined,
            startTime: parsedData?.startTime || undefined,
            feeFunds: parsedData?.feeFunds || undefined,
            configuration: parsedData?.configuration || undefined,
            conditions: parsedData?.conditions || undefined,
            trustlessAgent: parsedData?.trustlessAgent || undefined,
            icaAddressForAuthZ: parsedData?.icaAddressForAuthZ || undefined,
            connectionId: parsedData?.connectionId || undefined,
            hostConnectionId: parsedData?.hostConnectionId || undefined
          };

          console.log('Final flow input data:', flowInputData);
          setFlowInput(flowInputData);
        } catch (decodeErr) {
          console.error('Error decoding or parsing flow input:', decodeErr);
          throw new Error('Invalid flow input data format');
        }
      } catch (err) {
        console.error('Error in fetchFlowInput:', err);
        setError(err instanceof Error ? err.message : 'Failed to load flow input');
      } finally {
        setLoading(false);
      }
    }

    fetchFlowInput();
  }, [router.isReady, router.query]);


  return (
    <StyledWrapper style={{
      backgroundColor: bgColor,
      backgroundImage: `linear-gradient(to bottom, ${bgColor}00, ${bgColor}99)`,
    }}>
      <Column align="center" justifyContent="center" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          flexDirection: isSmallOrMediumScreen ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isSmallOrMediumScreen ? 'center' : 'flex-start',
          width: '100%',
          marginBottom: '24px',
          marginTop: '24px'
        }}>

          <div style={{ textAlign: 'center', flex: 1, marginBottom: isSmallOrMediumScreen ? '20px' : '0' }}>
            {imageUrl && (
              <div style={{ position: 'relative', margin: '0 auto' }}>
                {imageUrl && (
                  <div style={{ position: 'relative', margin: '0 auto' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Logo"
                      width={240}
                      height={120}
                      onError={(e) => {
                        console.error('Image failed to load:', imageUrl);
                        e.currentTarget.src = "https://intento.zone/assets/images/intento_tiny.png";
                      }}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
            )}
            <Text variant="header" align="center" style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              Sign and Submit Flows 💫
            </Text>
            {flowInput?.label && (
              <div style={{
                display: 'inline-block',
                padding: '6px 16px',
                backgroundColor: theme === "dark" ? 'rgba(80, 80, 255, 0.15)' : 'rgba(80, 80, 255, 0.1)',
                borderRadius: '20px',
                border: `1px solid ${theme === "dark" ? 'rgba(100, 100, 255, 0.3)' : 'rgba(100, 100, 255, 0.2)'}`,
                marginTop: '12px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <Text
                  variant="body"
                  style={{
                    fontWeight: 'medium',
                    color: theme === "dark" ? 'rgba(150, 150, 255, 1)' : 'rgba(80, 80, 255, 1)',
                    fontSize: '16px'
                  }}
                >
                  <span style={{ marginRight: '6px', fontSize: '14px' }}>✨</span>
                  {flowInput.label}
                </Text>
              </div>
            )}
          </div>

          {/* Wallet Button */}
          {!flowInput?.trustlessAgent || flowInput?.trustlessAgent?.feeLimit?.[0]?.denom == 'uinto' && <div style={{ width: isSmallOrMediumScreen ? '100%' : '300px', marginLeft: isSmallOrMediumScreen ? '0' : '20px' }}>
            <WalletButton
              onClick={openView}
              connected={walletStatusesConnected && isClientConnected}
              walletName={username}
              address={address || ''}
              onConnect={connectWallet}
              onDisconnect={resetWalletConnection}
            />
          </div>}
        </div>

        {/* Main content - Flow submission */}
        <div style={{ width: '100%' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text>Loading your flow data...</Text>
            </div>
          ) : error ? (
            <div style={{ color: 'red', textAlign: 'center', padding: '40px' }}>
              <Text>{error}</Text>
            </div>
          ) : flowInput ? (
            <PreviewAndSubmit
              flowInput={flowInput}
              onFlowChange={setFlowInput}
              initialChainId={chainId}
              isMobile={isSmallOrMediumScreen}
              bgColor={bgColor}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text>No flow data available</Text>
            </div>
          )}
        </div>




      </Column>
    </StyledWrapper>
  );
}