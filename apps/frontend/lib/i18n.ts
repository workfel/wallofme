import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";
import en from "@/translations/en.json";
import fr from "@/translations/fr.json";

const i18n = new I18n({ en, fr });

i18n.defaultLocale = "en";
i18n.enableFallback = true;

const deviceLocale = getLocales()[0]?.languageCode ?? "en";
i18n.locale = deviceLocale;

export default i18n;
