import { ScrollViewStyleReset } from "expo-router/html";
import React, { type PropsWithChildren } from "react";
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#246D52" />
        <meta
          name="description"
          content="هنر زندگی؛ آموزش گام‌به‌گام زنتنگل، ثبت آثار و روایت خاطره‌ها برای سالمندان"
        />
        <title>هنر زندگی | زنتنگل</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html:
              "body{background:#F8F3E9}*{box-sizing:border-box}a,button,input,textarea{outline-offset:4px}*:focus-visible{outline:3px solid #B1854C}input,textarea{direction:rtl}::selection{background:#DDE5D4}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
