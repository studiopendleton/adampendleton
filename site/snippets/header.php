<!doctype html>

<?php
$bodyColor = $site->bodyTextColor()->toColor();
$backgroundColor = $site->backgroundColor()->toColor();
$fontSize = $site->fontSize();
$mobileFontSize = $site->mobileFontSize();
$backgroundImage = $site->desktopBackgroundImage()->toFile()->url();
$mobileBackgroundImage = $site->mobileBackgroundImage()->toFile()->url();
$backgroundPosition = $site->backgroundPosition();
$backgroundFocus = $site->desktopBackgroundImage()->toFile()->focus();
$fontFamily = $site->font();
?>

<html lang="en" 
style="--body-color:<?= $bodyColor ?>;
--background-color:<?= $backgroundColor ?>;
--font-size:<?= $fontSize ?>;
--mobile-font-size-factor:<?= $mobileFontSize ?>;
--font-family: <?php e($fontFamily != null, '\'' . $fontFamily . '\'', '\'Arial\', sans-serif') ?>;
<?php if ($page->isHomePage()): ?>
  --background-image: url('<?= $backgroundImage ?>');
  --mobile-background-image: url('<?= $mobileBackgroundImage ?>');
<?php endif ?>
--background-position: <?= $backgroundPosition ?>;
--background-focus-x: <?= $backgroundFocus ?>;
--background-focus-y: <?= $backgroundFocus ?>;
<?php if ($site->blend()->toBool()) {
  echo '--blend: multiply;';
}; ?>
">
<head>

  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">

  <?php
    $title = $page->title();
    if ($page->display()->exists() && $page->display()->isNotEmpty()) {
      $title = strip_tags($page->display()->kirbytextinline());
    }
  ?>
  <?php if ($title == "Home"): ?>
    <title><?= $site->title() ?></title>
  <?php else: ?>
    <title><?= $title ?> | <?= $site->title() ?></title>
  <?php endif; ?>

  <?= css(['assets/fonts/fonts.css', 'assets/css/global.css', '@auto']) ?>
  <?= js(['https://cdnjs.cloudflare.com/ajax/libs/jquery/3.1.1/jquery.min.js', '@auto']) ?>

  <!-- Global site tag (gtag.js) - Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-147761494-1"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'UA-19147768-1');
  </script>
  
</head>


<body>