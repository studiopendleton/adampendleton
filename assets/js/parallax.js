function layoutHeights() {
  const backgroundImage = document.querySelector('#background-image');
  const background = document.querySelector('#background');

  const foreground = document.querySelector('main');
  const foregroundHeight = foreground.scrollHeight;

  backgroundImage.style.setProperty('height', foregroundHeight * 1.25 + 'px');

}

layoutHeights();
window.addEventListener('resize', layoutHeights);

$.fn.moveIt = function(){
  
    var $window = $(window);
    var instances = [];
    
    $(this).each(function(){
      instances.push(new moveItItem($(this)));
    });
    
    // Function to update scroll positions
    function updateInstances(){
      var scrollTop = $window.scrollTop();
      instances.forEach(function(inst){
        inst.update(scrollTop);
      });
    }
  
    // Listen to scroll events
    window.onscroll = function(){
      updateInstances();
    };
  
    // Listen to resize events and re-fetch data-scroll-speed
    window.onresize = function(){
      instances.forEach(function(inst){
        inst.refreshSpeed();  // Re-fetch speed when window is resized
      });
      updateInstances();  // Update scroll positions after resizing
    };
  }
  
  var moveItItem = function(el){
    this.el = $(el);
    this.refreshSpeed();  // Fetch speed initially
  };
  
  // Method to update the scroll speed dynamically
  moveItItem.prototype.refreshSpeed = function(){
    this.speed = parseInt(this.el.attr('data-scroll-speed')); // Fetch data-scroll-speed on resize
  };
  
  moveItItem.prototype.update = function(scrollTop){
    this.el.css('transform', 'translateY(' + -(scrollTop / this.speed) + 'px)');
  };
  
  // Initialization
  $(function(){
    $('[data-scroll-speed]').moveIt();
  });
  