const blocks = document.querySelectorAll('.block');

blocks.forEach((block, index) => {

  let previousHeight = 0;
  const grafs = block.querySelectorAll('p, ul');

  grafs.forEach((graf, index) => {

  // Skip the first paragraph since it has no previous paragraph
  if (index > 0) {
    graf.style.top = `${previousHeight}px`;
  }
  const grafHeight = graf.offsetHeight;

  // Update previousHeight to include the current block's height
  previousHeight += grafHeight;
  });
  
});
