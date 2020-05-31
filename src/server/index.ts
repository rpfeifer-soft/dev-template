/** @format */
import options from './options.js';

export default function getIndexHtml() {
   return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<meta name="theme-color" content="#000000">
<meta name="apple-mobile-web-app-title" content="${options.getTitle()}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">

<base href="${options.getBaseUrl() || '/'}">
<link rel="manifest" href="content/manifest.json">
<link rel="shortcut icon" href="content/favicon_web.png">
<link rel="apple-touch-icon" href="content/favicon_ios.png">
<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet">

<link rel="stylesheet" href="content/app.css"></link>
<title>${options.getTitle()}</title>
</head>
<body>
<noscript>
 You need to enable JavaScript to run this app.
</noscript>
<div id="app"></div>
</body>
<script type="text/javascript">
   window.isProduction = ${options.isProduction() ? 'true' : 'false'};
</script>
<script type="text/javascript" src="bundle.js"></script></body>
</html>`;
}