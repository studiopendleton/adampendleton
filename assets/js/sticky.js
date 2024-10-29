// Get all divs with the class "block"
const blocks = document.querySelectorAll('.block');

// Variable to store the cumulative height of the previous blocks
let previousHeight = 0;

blocks.forEach((block, index) => {
  // Get the height of the current block

  // Skip the first block since it has no previous block
  if (index > 0) {
    block.style.position = 'sticky';
    block.style.top = `${previousHeight}px`;
  }
  const blockHeight = block.offsetHeight;

  // Update previousHeight to include the current block's height
  previousHeight += blockHeight;
});

const lastBlock = blocks[blocks.length - 1];

window.addEventListener('scroll', () => {

  const lastBlockRect = lastBlock.getBoundingClientRect().top;
  console.log(lastBlockRect);
  console.log(parseFloat(lastBlock.style.top));

  if (parseFloat(lastBlock.style.top) > lastBlockRect) {
    blocks.forEach((block, index) => {
      block.style.position = 'static';
      block.style.margin = 0;
      block.style.top = block.getBoundingClientRect().top + 'px';
    });
  }

});