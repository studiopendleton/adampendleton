</main>



</div>

<footer>
  <?= $site->footerText()->kt() ?>
</footer>

<?php $isMobile = is_numeric(strpos(strtolower($_SERVER["HTTP_USER_AGENT"]), "mobile")); ?>

</body>
</html>
