var FilmList = {
  init: () => {
    console.log('Please set a FilmList.apikey value.')

    var films = []
    films.sortByRank = function () {
      this.sort((a, b) => {
        return a.rank - b.rank
      })
    }
    films.getByRank = function (value, returnType) {
      for (var i = 0, n = this.length; i < n; i++) {
        if (this[i].rank === value) {
          if (returnType === 'index') {
            return i
          } else {
            return this[i]
          }
        }
      }
    }

    var addFilmButton = document.getElementById('addFilm')
    addFilmButton.onclick = addFilm

    var searchField = document.getElementById('search')

    var searchOnInput = debounce(searchForFilm, 250)
    searchField.addEventListener('input', (event) => {
      event.preventDefault()
      searchOnInput()
    })

    function debounce (fn, ms) {
      let handle
      return () => {
        if (handle) {
          clearTimeout(handle)
        }
        handle = setTimeout(() => {
          fn()
          handle = null
        }, ms)
      }
    }

    function searchForFilm () {
      let input = document.getElementById('search').value

      function removeSuggestionDropDown () {
        let suggestionDropDown = document.getElementById('suggestion-drop-down')
        if (suggestionDropDown) {
          suggestionDropDown.parentElement.removeChild(suggestionDropDown)
        }
      }

      function request (url, callback) {
        let xhr = new XMLHttpRequest()
        xhr.open('GET', url)
        xhr.send()
        xhr.addEventListener('readystatechange', callback.bind(xhr), false)
      }

      if (!input) {
        removeSuggestionDropDown()
        return
      }

      let url = 'http://www.omdbapi.com/?apikey=' + FilmList.apikey + '&type=movie&s=' + input
      request(url, processResponse)

      function processResponse (e) {
        if (this.readyState === 4) {
          let response = JSON.parse(this.responseText)

          if (response.Response === 'False') {
            return false
          }

          let results = response.Search.slice(0, 5).map((x) => {
            return new Suggestion(x.Title, x.Year, x.imdbID, x.Poster)
          })

          removeSuggestionDropDown()
          let suggestionDropDown = document.createElement('div')
          suggestionDropDown.id = 'suggestion-drop-down'
          let suggestionList = document.createElement('ul')

          for (var i = 0, n = results.length; i < n; i++) {
            let currentListItem = results[i].createListItem()
            suggestionList.appendChild(currentListItem)
          }
          suggestionDropDown.appendChild(suggestionList)
          searchField.parentElement.appendChild(suggestionDropDown)
        }
      }

      var Suggestion = function Suggestion (title, year, id, poster) {
        this.display = title + ' (' + year + ')'
        this.title = title
        this.year = year
        this.id = id
        this.poster = poster
      }
      Suggestion.prototype.createListItem = function createListItem () {
        let listItem = document.createElement('li')
        listItem.id = this.id
        listItem.innerText = this.display

        listItem.addEventListener('click', () => {
          removeSuggestionDropDown()
          let fields = {
            title: document.getElementById('title'),
            director: document.getElementById('director'),
            year: document.getElementById('year')
          }
          fields.title.value = this.title
          fields.year.value = this.year

          let url = 'http://www.omdbapi.com/?apikey=' + FilmList.apikey + '&i=' + this.id
          request(url, processResponse)
          function processResponse (e) {
            if (this.readyState === 4) {
              var director = JSON.parse(this.responseText).Director
              fields.director.value = director
            }
          }
        })
        return listItem
      }
    }

    function addFilm () {
      let numberOfFilms = films.length

      function insertFilm () {
        let film = new Film(title, director, year, rank)
        films.push(film)
        film.addToDOM()

        // clear field placeholders and values.
        let addFields = document.querySelectorAll('.add-field')
        for (var i = 0, n = addFields.length; i < n; i++) {
          addFields[i].placeholder = ''
          addFields[i].value = ''
        }
      }

      var title = document.getElementById('title').value
      // Make sure there is at least a title.
      if (!title) {
        errorMessage('You need a title.')
        return
      }
      var director = document.getElementById('director').value
      var year = document.getElementById('year').value
      var rank = document.getElementById('rank').value

      if (!rank) {
        // Each Film object will be an indexed property of the films array.
        // if the array is empty, the rank should be 1.
        if (numberOfFilms === 0) {
          rank = 1
        // find the first non consecutive rank (the hole) and insert, or insert at the end if all ranks are consecutive.
        } else {
          for (var i = 0; i <= numberOfFilms; i++) {
            if (i === numberOfFilms || films[i].rank !== i + 1) {
              rank = i + 1
              break
            }
          }
        }
        insertFilm()
      } else {
        rank = parseInt(rank)
        if (isNaN(rank) || rank <= 0) {
          errorMessage('Rank must be a positive number.')
          return
        } else if (numberOfFilms === 0 || rank > films[numberOfFilms - 1].rank) {
          insertFilm()
        } else {
          var filmToChange = films.getByRank(rank)
          while (filmToChange) {
            var nextFilmToChange = films.getByRank(filmToChange.rank + 1)
            filmToChange.rank += 1
            filmToChange = nextFilmToChange
          }
          insertFilm()
        }
      }
      // make sure the array is sorted by rank after each addition.
      films.sortByRank()
    }

    // constructor for individual films, as we will make multiple
    var Film = function Film (title, director, year, rank) {
      this.title = title
      this.director = director
      this.year = year
      this.rank = rank
    }
    Film.prototype.delete = function () {
      var filmElement = document.querySelector('li[value="' + this.rank + '"]')
      filmElement.parentElement.removeChild(filmElement)
      let filmIndex = films.getByRank(this.rank, 'index')
      films.splice(filmIndex, 1)
    }
    Film.prototype.move = function (direction) {
      var list = document.getElementById('list')
      if (direction === 'down') { // move the element down in the DOM
        // get the next element.
        var nextFilmElement = getElementSibling(filmElement, 'nextSibling')
        // if there is a next element to retrieve, get the object with rank exactly one more than the event target.
        if (nextFilmElement) {
          var nextFilmObj = films.getByRank(this.rank + 1)
          // if the object exists, decrease its rank by 1, and rearrange the elements.
          if (nextFilmObj) {
            nextFilmObj.rank -= 1
            if (nextFilmElement.value === this.rank + 1) {
              // get the element after the next element, because we are using insertBefore.
              let secondSibling = nextFilmElement.nextSibling
              list.removeChild(filmElement)
              if (secondSibling) {
                list.insertBefore(filmElement, secondSibling)
              } else {
                // if there is no next next element, just append the element to the end of the list.
                list.appendChild(filmElement)
              }
            }
            nextFilmElement.value -= 1
          }
        }
        // once everything is arranged properly, increase the rank and list item value of the event target by 1.
        this.rank += 1
        filmElement.value += 1

      // move the element up in the DOM
      } else if (filmElement.value !== 1) {
        // get the previous element.
        let previousFilmElement = getElementSibling(filmElement, 'previousSibling')
        // if there is a previous element to retrieve, get the object with rank exactly one less than the event target.
        if (previousFilmElement) {
          var previousFilmObj = films.getByRank(this.rank - 1)
          // if the object exists, increase its rank by 1, and rearrange the elements.
          if (previousFilmObj) {
            previousFilmObj.rank += 1
            if (previousFilmElement.value === this.rank - 1) {
              list.removeChild(filmElement)
              list.insertBefore(filmElement, previousFilmElement)
            }
            previousFilmElement.value += 1
          }
        }
        // once everything is arranged properly, decrease the rank and list item value of the event target by 1.
        this.rank -= 1
        filmElement.value -= 1
      }

      films.sortByRank()
    }

    // method to add the object data to the DOM added the the prototype of Film.
    Film.prototype.addToDOM = function () {
      var list = document.getElementById('list')
      var li = document.createElement('li')
      li.innerHTML = this.title

      // make the number in the ordered list the proper rank.
      li.value = this.rank

      // if there is a year, add it in parenthesis to the title.
      if (this.year) {
        li.innerHTML += ' (' + this.year + ')'
      }

      // check rank before inserting the list item into the DOM
      // If it's the highest numerical rank, just add it to the end of the list.
      if (this.rank > films[films.length - 1].rank) {
        list.appendChild(li)
      // if the rank is 1, insert at the top of the list and increase the rank of each item beneath.
      } else if (this.rank === 1) {
        var listItems = document.querySelectorAll('#list li')
        var valueCheck = 1
        for (var p in listItems) {
          if (listItems[p].value !== valueCheck) {
            break
          }
          listItems[p].value += 1
          valueCheck++
        }
        list.insertBefore(li, list.firstChild)
      // Otherwise, increase the rank of each item beneath, and add in the appropriate slot.
      } else {
        var listItems = document.querySelectorAll('#list li')
        var valueCheck = this.rank
        for (var p in listItems) {
          if (listItems[p].value > valueCheck + 1) {
            break
          } else if (listItems[p].value === valueCheck) {
            listItems[p].value += 1
            valueCheck++
          }
        }
        var liNext
        for (var p in listItems) {
          if (listItems[p].value > this.rank) {
            liNext = listItems[p]
            break
          }
        }
        list.insertBefore(li, liNext)
      }

      // if there is a director, add it to the next line of the list item.
      if (this.director) {
        let director = document.createElement('span')
        director.className = 'director'
        director.innerHTML = 'directed by ' + this.director
        li.appendChild(document.createElement('br'))
        li.appendChild(director)
      }

      // finally, add links to move the item up or down.
      var movementLinks = document.createElement('p')
      movementLinks.className = 'movement-links'

      function createMoveLink (text, method, direction) {
        var moveLink = document.createElement('a')
        moveLink.innerHTML = text
        moveLink.href = '#'
        if (direction === 'delete') {
          moveLink.className = 'delete-link'
        }
        moveLink.onclick = (event) => {
          event.preventDefault()
          var currentFilmRank = event.target.parentElement.parentElement.value
          var filmObject = films.getByRank(currentFilmRank)
          filmObject[method](direction)
        }
        movementLinks.appendChild(moveLink)
        return moveLink
      }

      createMoveLink('&#8593; move up', 'move', 'up')
      createMoveLink('&#8595; move down', 'move', 'down')
      createMoveLink('&#10006; delete', 'delete', 'delete')

      li.appendChild(movementLinks)
    }

    // simple function to find adjacent siblings while avoiding whitespace and other non-elements.
    function getElementSibling (element, nextOrPrevious) {
      do {
        element = element[nextOrPrevious]
      } while (element && element.nodeType !== 1)
      return element
    }

    // function produces an error messag within the DOM instead of an alert dialog box.
    function errorMessage (message) {
      var element = document.querySelector('p.alert')
      element.innerHTML = message
      element.style.backgroundColor = 'red'
      var op = 1  // initial opacity
      element.style.opacity = 1

      // setTimeout waits 3/4s of a second then slowly fades the p.alert element out using setInterval.
      setTimeout(() => {
        var timer = setInterval(() => {
          if (op <= 0.01) {
            clearInterval(timer)
            element.style.backgroundColor = 'white'
          }
          element.style.opacity = op
          element.style.filter = 'alpha(opacity=' + op * 100 + ')'
          op -= op * 0.1
        }, 50)
      }, 750)
    }
  }
}

window.onload = FilmList.init
