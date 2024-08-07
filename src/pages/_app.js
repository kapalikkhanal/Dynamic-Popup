import "../styles/globals.css";
import "../styles/loader.css";
import "../styles/popup.css";
import "../styles/toggleSwitch.css";
import "../styles/uploadImage.css";

import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}
