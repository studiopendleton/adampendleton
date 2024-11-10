<?php snippet('header') ?>

<?php $isMobile = is_numeric(strpos(strtolower($_SERVER["HTTP_USER_AGENT"]), "mobile")); ?>

  <main>
    <div class="video-layout-wrapper">
      <div class="video-container">
        <?php if ($page->file()): ?>
          <video src="<?= $page->file()->url() ?>" <?= e($page->autoplay()=='true', 'autoplay')?> controls <?= 'loop="'.$page->loop().'"'?> width="100%" id="vid">
          </video>
        <?php endif; ?>
      </div>
    </div>
  </main>

<?php snippet('footer') ?>
