<?php snippet('header') ?>

<?php $isMobile = is_numeric(strpos(strtolower($_SERVER["HTTP_USER_AGENT"]), "mobile")); ?>

  <div class="layout-wrapper">
    <div class="video-layout-wrapper">
      <div class="video-container">
        <?php if ($page->file()): ?>
          <video src="<?= $page->file()->url() ?>" <?= e($page->autoplay()=='true', 'autoplay')?> muted controls <?= 'loop="'.$page->loop().'"'?> width="100%" id="vid">
          </video>
          
        <?php if(!$isMobile): ?>
          <button id="mute-toggle" class="muted">Sound on</button>
        <?php endif ?>

          <script>
          var muteToggle = document.getElementById("mute-toggle");
          var vid = document.getElementById("vid");

          muteToggle.addEventListener('click', function(){
            if(vid.muted === true) {
              vid.muted = false;
              this.innerText = 'Sound off';
            } else {
              vid.muted = true;
              this.innerText = 'Sound on';
            }
          });
          </script>

        <?php endif; ?>
      </div>
    </div>
  </div>

<?php snippet('footer') ?>
