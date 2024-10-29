<?php snippet('header') ?>

<?php $isMobile = is_numeric(strpos(strtolower($_SERVER["HTTP_USER_AGENT"]), "mobile")); ?>

    <main>

    <div class="blocks">
      <?php foreach ($site->mainText()->toBlocks() as $block): ?>
        <div id="<?= $block->id() ?>" class="block block-type-<?= $block->type() ?>" style="min-height:<?= $site->frameHeight()->toFloat() ?>vh;">
          <?= $block ?>
        </div>
      <?php endforeach ?>
    </div>
    
<!--  </div>
</div> !-->

<?php snippet('footer') ?>
