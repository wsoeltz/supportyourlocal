import React, {
  Suspense,
  createContext,
  lazy,
  useState,
  useEffect,
} from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';
import GlobalStyles from './styling/GlobalStyles';
import Helmet from 'react-helmet';
import { Root } from './styling/Grid';
import { Routes } from './routing/routes';
import debounce from 'lodash/debounce';
import './styling/fonts/fonts.css';
import Loading from './components/general/Loading';

const LandingPage = lazy(() => import('./pages/landingPage'));
const PageNotFound = lazy(() => import('./pages/pageNotFound'));

export interface IAppContext {
  windowWidth: number;
}

export const AppContext = createContext<IAppContext>({windowWidth: window.innerWidth});

function App() {

  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  const appContext = {windowWidth};


  useEffect(() => {
    const updateWindowWidth = debounce(() => {
      setWindowWidth(window.innerWidth);
    }, 500);
    window.addEventListener('resize', updateWindowWidth);
    return () => {
      window.removeEventListener('resize', updateWindowWidth);
    };
  }, []);

  const defaultMetaTitle = '#supportyourlocal';
  const defaultMetaDescription = 'Support your local businesses during the COVID-19 pandemic';

  // REMOVE THIS ONCE WE MOVE TO AWS
  const basename = window.location.host === 'cid-harvard.github.io'
    ? '/country-tools-front-end' : undefined;

  return (
    <>
      <AppContext.Provider value={appContext}>
        <Helmet>
          {/* Set default meta data values */}
          <title>{defaultMetaTitle}</title>
          <meta name='description' content={defaultMetaDescription} />
          <meta property='og:title' content={defaultMetaTitle} />
          <meta property='og:description' content={defaultMetaDescription} />
        </Helmet>
        <Router basename={basename}>
          <Root>
            <GlobalStyles />
            <Suspense fallback={<Loading />}>
              <Switch>
                <Route exact path={Routes.Landing}
                  render={(props: any) => <LandingPage {...props} />}
                />
                {/* If none of the above routes are found show the 404 page */}
                <Route component={PageNotFound} />
              </Switch>
            </Suspense>
          </Root>
        </Router>
      </AppContext.Provider>
    </>
  );
}

export default App;
