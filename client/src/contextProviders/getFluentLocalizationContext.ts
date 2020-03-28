import {
  ReactLocalization,
} from 'fluent-react/compat';
import {
  FluentBundle,
} from 'fluent/compat';
import raw from 'raw.macro';
import {
  createContext,
} from 'react';

enum Languages {
  English = 'en',
  German = 'de',
  Spanish = 'es',
  French = 'fr',
}

const languageRaw = navigator.language;

let bundleLanguage: Languages;
let messageBundle: string;
if (languageRaw.includes(Languages.English)) {
  bundleLanguage = Languages.English;
  messageBundle = raw('./messages-en.ftl');
} else if (languageRaw.includes(Languages.German)) {
  bundleLanguage = Languages.German;
  messageBundle = raw('./messages-de.ftl');
} else if (languageRaw.includes(Languages.Spanish)) {
  bundleLanguage = Languages.Spanish;
  messageBundle = raw('./messages-es.ftl');
} else if (languageRaw.includes(Languages.French)) {
  bundleLanguage = Languages.French;
  messageBundle = raw('./messages-fr.ftl');
} else {
  bundleLanguage = Languages.English;
  messageBundle = raw('./messages-en.ftl');
}

const getLocalizationInfo = (messages: string) => {
  const bundle = new FluentBundle([bundleLanguage]);
  bundle.addMessages(messages);
  function* generateBundles(_locales: string[]) {
    yield bundle;
  }
  const localization = new ReactLocalization(generateBundles([bundleLanguage]));
  const localizationAndBundle = {localization, bundle};
  const LocalizationAndBundleContext = createContext(localizationAndBundle);
  return {
    localizationAndBundle, LocalizationAndBundleContext,
  };
};

const {
  localizationAndBundle: appLocalizationAndBundle,
  LocalizationAndBundleContext: AppLocalizationAndBundleContext,
} = getLocalizationInfo(messageBundle);

export {
  appLocalizationAndBundle, AppLocalizationAndBundleContext,
};
