import { media, styled, useControlTheme, useMedia } from 'components/ui-blocks'
import { MAIN_PANE_MAX_WIDTH } from 'util/constants'

import { FooterBar } from './FooterBar'
import { NavigationSidebar } from './NavigationSidebar'

import { useEffect, useState } from 'react'
import type { Container } from '@tsparticles/engine'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { useAtom } from 'jotai'
import { particleState } from '../../state/atoms/particlesAtoms'

export const AppLayout = ({
  navigationSidebar = <NavigationSidebar />,
  footerBar = <FooterBar />,
  children,
}) => {
  const isSmallScreen = useMedia('sm')
  const themeController = useControlTheme()

  const [isConfetti, popConfetti] = useAtom(particleState)
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (isConfetti) {
      const timer = setTimeout(() => {
        popConfetti(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isConfetti, popConfetti]);

  // this should be run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
      // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
      // starting from v2 you can add only the features you need reducing the bundle size
      //await loadAll(engine);
      //await loadFull(engine);
      await loadSlim(engine);
      //await loadBasic(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container);
  };


  const isDarkMode = themeController.theme.name === 'dark'


  if (isSmallScreen) {
    return (
      <StyledWrapperForMobile>
        <StyledContainerForMobile>
          {navigationSidebar}
          <main data-content="">{children}</main>
        </StyledContainerForMobile>
        <StyledContainerForMobile>
          <div data-content="">{footerBar}</div>
        </StyledContainerForMobile>
      </StyledWrapperForMobile>
    )
  }


  // Confetti configuration
  const confettiConfig = {
    emitters: {
      position: {
        x: 50,
        y: 50
      },
      rate: {
        quantity: 10,
        delay: 0.1
      }
    },
    particles: {
      color: {
        value: ["#1E00FF", "#FF0061", "#E1FF00", "#00FF9E"]
      },
      move: {
        decay: 0.05,
        direction: "top" as const,
        enable: true,
        gravity: {
          enable: true
        },
        outModes: {
          top: "none" as const,
          default: "destroy" as const
        },
        speed: { min: 25, max: 50 }
      },
      number: {
        value: 0
      },
      opacity: {
        value: 1
      },
      rotate: {
        value: {
          min: 0,
          max: 360
        },
        direction: "random",
        animation: {
          enable: true,
          speed: 30
        }
      },
      tilt: {
        direction: "random",
        enable: true,
        value: { min: 0, max: 360 },
        animation: {
          enable: true,
          speed: 30
        }
      },
      shape: {
        type: ["circle", "square"]
      },
      size: {
        value: 8
      },
      roll: {
        darken: {
          enable: true,
          value: 25
        },
        enlighten: {
          enable: true,
          value: 25
        },
        enable: true,
        speed: {
          min: 5,
          max: 15
        }
      },
      wobble: {
        distance: 30,
        enable: true,
        speed: {
          min: -7,
          max: 7
        }
      }
    },
    responsive: [
      {
        maxWidth: 600,
        options: {
          particles: {
            move: {
              speed: 15
            }
          }
        }
      }
    ]
  };

  return (
    <>
      <StyledWrapper theme={isDarkMode ? 'dark' : 'light'}>
        {navigationSidebar}
        <StyledContainer>
          <StyledChildren>
            {children}
          </StyledChildren>
        </StyledContainer>
      </StyledWrapper>
      {init && isConfetti && (
        <Particles
          id="tsparticles"
          particlesLoaded={particlesLoaded}
          options={confettiConfig}
        />
      )}
    </>
  )
}

const StyledWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'row',
  minHeight: '100vh',
  variants: {
    theme: {
      dark: {
        background: `
          linear-gradient(
            to bottom left,
            rgba(5, 2, 10, 1) 0%,
            rgba(5, 2, 10, 1) 60%,
            rgba(15, 5, 30, 1) 100%
          )`,
        backgroundAttachment: 'fixed',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: '50%',
          left: '50%',
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 80% 80%, rgba(70, 30, 120, 0.5) 0%, transparent 60%)',
          zIndex: 0,
          pointerEvents: 'none'
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          top: '20%',
          left: '80%',
          width: '30%',
          height: '30%',
          background: 'radial-gradient(circle, rgba(100, 60, 180, 0.2) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(30px)'
        }
      },
      light: {
        background: `
          linear-gradient(
            to bottom left,
            rgba(225, 235, 255, 1) 0%,
            rgba(240, 245, 255, 1) 60%,
            rgba(255, 255, 255, 1) 100%
          )`,
        backgroundAttachment: 'fixed',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.15) 0%, transparent 60%)',
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(40px)'
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          top: '20%',
          left: '70%',
          width: '30%',
          height: '30%',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: '50%',
          filter: 'blur(30px)'
        }
      }

    }
  },
  [media.md]: {
    gridTemplateColumns: '25rem 1fr',
  },
})

const StyledChildren = styled('div', {
  position: 'relative',
  zIndex: 1,
  padding: '$12',

})

const StyledContainer = styled('div', {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',

  padding: '0 $24 $24 $24',
  '& main': {
    margin: '0 auto',
    width: '100%',
  },
  maxWidth: '100%',
  width: MAIN_PANE_MAX_WIDTH,
})

const StyledWrapperForMobile = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '100vh',
  backgroundColor: '$backgroundColors$base',
})

const StyledContainerForMobile = styled('div', {
  position: 'relative',
  zIndex: '$1',
  '& [data-content]': {
    margin: '0 auto',
    width: '100%',
    padding: '0 $4',
  },
})
