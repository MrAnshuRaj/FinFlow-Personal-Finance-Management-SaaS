import "./globals.css";
import { Providers } from "./providers";
export const metadata = { title: "FinFlow | Your money, in flow", description: "Personal finance management" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><Providers>{children}</Providers></body></html>; }
