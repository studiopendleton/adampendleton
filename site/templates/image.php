<?php
/**
 * Templates render the content of your pages.
 * They contain the markup together with some control structures like loops or if-statements.
 * The `$page` variable always refers to the currently active page.
 * To fetch the content from each field we call the field name as a method on the `$page` object, e.g. `$page->title()`.
 * This home template renders content from others pages, the children of the `photography` page to display a nice gallery grid.
 * Snippets like the header and footer contain markup used in multiple templates. They also help to keep templates clean.
 * More about templates: https://getkirby.com/docs/guide/templates/basics
 */
?>

<?php snippet('header') ?>
  <main>
    <div class="carousel-wrapper">
      <div class="previous"></div>
      <div class="next"></div>
    <div class="carousel">
      <?php foreach($page->gallery_images()->toFiles() as $image): ?>
        <div class="carousel-cell">
          <img data-flickity-lazyload-src="<?= $image->resize(2000)->url(); ?>">
          <noscript>
            <img src="<?= $image->resize(2000)->url(); ?>">
          </noscript>
          <div class="image-information">
            <?php if ($image->work_description()->isNotEmpty()): ?>
              <div class="balance-text-child"><?= $image->work_description()->kirbytext(); ?></div>
            <?php endif;?>
            <?php if ($image->caption()->isNotEmpty()): ?>
              <div class="balance-text-child"><?= $image->caption()->kirbytext(); ?></div>
            <?php endif;?>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>

  <script>
    var utils = window.fizzyUIUtils;
    var elem = document.querySelector('.carousel');
    var flkty = new Flickity( elem, {
      // options
      contain: true,
      wrapAround: true,
      lazyLoad: 2,
      pageDots: false,
      prevNextButtons: false,
      dragThreshold: 1,
      selectedAttraction: 0.05,
      friction: 0.4
});

var previousButton = document.querySelector('.previous');
previousButton.addEventListener( 'click', function() {
  flkty.previous();
});

var nextButton = document.querySelector('.next');
nextButton.addEventListener( 'click', function() {
  flkty.next();
});

document.addEventListener('keydown', (e) => {
  if(e.keyCode == 37) {
    flkty.previous();
  }
  if(e.keyCode == 39) {
    flkty.next();
  }
});

  </script>

  <?= js(['assets/js/lazy-load.js']); ?>
<?php snippet('footer') ?>
