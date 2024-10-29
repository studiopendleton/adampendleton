</main>



</div>

<footer>
  <?= $site->footerText()->kt() ?>
</footer>

<?php $isMobile = is_numeric(strpos(strtolower($_SERVER["HTTP_USER_AGENT"]), "mobile")); ?>

  <?= js(['assets/js/global.js', '@auto']) ?>
  <?php e($site->parallax()->toBool(), js(['assets/js/parallax.js'])) ?>

</body>
</html>
