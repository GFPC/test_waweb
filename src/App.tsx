import React, { useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { Helmet } from 'react-helmet-async'
import SITE_CONSTANTS from './siteConstants'
import * as API from './API'
import { IRootState } from './state'
import { configSelectors } from './state/config'
import { userActionCreators } from './state/user'
import Theme from './components/Theme'
import { ModalHost } from './components/modals'
import AppRoutes from './Routes'
import './App.scss'

const mapStateToProps = (state: IRootState) => ({
  language: configSelectors.language(state),
  configStatus: configSelectors.status(state),
})

const mapDispatchToProps = {
  initUser: userActionCreators.initUser,
}

const connector = connect(mapStateToProps, mapDispatchToProps)

interface IProps extends ConnectedProps<typeof connector> {
}

const App: React.FC<IProps> = ({
  language,
  configStatus,
  initUser,
}) => {
  if ((window as any).ReactNativeWebView) {
    (window as any).ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'SYSTEM', message: 'START' }),
    )
  }

  useEffect(() => {
    console.log('[App] useEffect: initUser dispatch')
    initUser()

    API.activateChatServer()
    const interval = setInterval(() => API.activateChatServer(), 30000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const getMetaTags = () => {
    let _domain = `${window.location.protocol}//${window.location.host}/`

    return (
      <Helmet>
        {SITE_CONSTANTS.OG_IMAGE && (
          <meta property="og:image" content={_domain + SITE_CONSTANTS.OG_IMAGE} />
        )}
        {SITE_CONSTANTS.TW_IMAGE && (
          <meta
            property="twitter:image"
            content={_domain + SITE_CONSTANTS.TW_IMAGE}
          />
        )}
        <style>{`
          .colored {
            color: ${SITE_CONSTANTS.PALETTE.primary.dark}
          }

          section details summary {
            color: ${SITE_CONSTANTS.PALETTE.primary.dark};
          }
          section details summary::after {
            border-top: 10px solid ${SITE_CONSTANTS.PALETTE.primary.main};
          }

          .modal .active {
            color: ${SITE_CONSTANTS.PALETTE.primary.dark}
          }
          .modal form fieldset h3, .modal form fieldset h4 {
            color: ${SITE_CONSTANTS.PALETTE.primary.dark}
          }

          .phone-link {
            border-bottom: 1px solid ${SITE_CONSTANTS.PALETTE.primary.light};
          }
          .phone-link:hover {
            border-bottom-color: ${SITE_CONSTANTS.PALETTE.primary.dark};
          }
        `}</style>
      </Helmet>
    )
  }

  const showAuthDebug = typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('debugAuth') === '1' ||
      localStorage.getItem('debugAuth') === '1')

  return (
    <React.Fragment key={`${language.id}_${configStatus}`}>
      <Theme>
        {getMetaTags()}
        <AppRoutes />
        <ModalHost />
        {showAuthDebug && <AuthDebugOverlay />}
      </Theme>
    </React.Fragment>
  )
}

function AuthDebugOverlay() {
  const [info, setInfo] = React.useState<Record<string, unknown> | null>(null)
  useEffect(() => {
    const poll = () => setInfo({ ...(window as any).__authDebug } as Record<string, unknown>)
    poll()
    const id = setInterval(poll, 500)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.9)', color: '#0f0', padding: 12, fontSize: 12,
      fontFamily: 'monospace', maxHeight: 200, overflow: 'auto',
    }}>
      <b>Auth Debug (?debugAuth=1)</b>
      <pre style={{ margin: '4px 0' }}>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}

export default connector(App)