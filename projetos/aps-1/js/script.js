window.addEventListener('mousemove', (e) =>{


  if(e.toElement.attributes[1] !== undefined) {
      if(e.toElement.attributes[1].nodeValue === 'btn'){
          var line = document.getElementById('line')
          line.style.width = `${e.target.clientWidth}px`
          line.style.left = `${e.target.offsetLeft}px ` 
          setTimeout(function(){
              line.style.opacity = '1'
          },100)
  
      }
  }
})


function href(value, page){
  if(window.location.pathname.includes(page)){
      window.location.reload()
      return
  }
  window.location = value
}