var FilmList = (function() {
	return {
		init: function() {
			console.log('Please set a FilmList.apikey value.')
			var films = []
			var addFilmButton = document.getElementById("addFilm")
			addFilmButton.onclick = addFilm

			var searchField = document.getElementById('search')
			searchField.addEventListener('keyup', function(event) {
				event.preventDefault()
				if (event.keyCode == 13) {
					searchForFilm()
				}
			})

			var searchOnInput = debounce(searchForFilm, 250)
			searchField.addEventListener('input', function(event) {
				event.preventDefault()
				searchOnInput()
			})

			function debounce(fn, ms) {
				var handle
				return function () {
					clearTimeout(handle)
					handle = setTimeout(function () {
						fn()
						handle = null
					}, ms)
				}
			}

			function searchForFilm() {
				var input = document.getElementById('search').value

				function removeSuggestionDropDown() {
					var suggestionDropDown = document.getElementById('suggestion-drop-down')
					if (suggestionDropDown) {
						suggestionDropDown.parentElement.removeChild(suggestionDropDown)
					}
				}

				if (!input) {
					removeSuggestionDropDown()
					return
				}

				var url = 'http://www.omdbapi.com/?apikey=' + FilmList.apikey + '&type=movie&s=' + input
				var xhr = new XMLHttpRequest()
				xhr.open('GET', url)
				xhr.send()
				xhr.addEventListener('readystatechange', processResponse, false)

				function processResponse(e) {
				  if (xhr.readyState == 4) {
				    var response = JSON.parse(xhr.responseText)

				    if (response.Response === "False") {
				    	return false
				    }

				    var results = response.Search.slice(0,5).map((x) => {
				    	return { 
				    		display: x.Title + ' (' + x.Year + ')',
				    		title: x.Title,
				    		year: x.Year,
				    		id: x.imdbID,
				    		poster: x.Poster
				    	}
				    })

				    removeSuggestionDropDown()
				    var suggestionDropDown = document.createElement('div')
				    suggestionDropDown.id = 'suggestion-drop-down'
				    var suggestionList = ''

				    for (i = 0, n = results.length; i < n; i++) {
				    	suggestionList += '<li id=' + results[i].id + '>' + results[i].display + '</li>'
				    }
				    suggestionList = '<ul>' + suggestionList + '</ul>'
				    suggestionDropDown.innerHTML = suggestionList
				    searchField.parentElement.appendChild(suggestionDropDown)
				  }
				}
			}
		
			function addFilm() {
				function insertFilm() {
					films.push(new Film(title, director, year, rank))
					films[films.length - 1].addToDOM()
				}

				var title = document.getElementById("title").value
				// Make sure there is at least a title.
				if(!title) {
					errorMessage("You need a title.")
					return
				}
				var director = document.getElementById("director").value
				var year = document.getElementById("year").value
				var rank = document.getElementById("rank").value
				
				if (!rank) {
					// Each Film object will be an indexed property of the films literal object.
					// if the array is empty, the rank should be 1.
					if (films.length == 0) {
						rank = 1
					// find the first non consecutive rank (the hole) and insert, or insert at the end if all ranks are consecutive.
					} else {
						for (i = 0; i <= films.length; i++) {
							if (i == films.length || films[i].rank != i+1) {
								rank = i+1
								break
							}
						}
					}
					insertFilm()
					
				} else {
					rank = parseInt(rank)
					if (isNaN(rank) || rank <= 0) {
						errorMessage("Rank must be a positive number.")
						return
					} else if (films.length == 0 || rank > films[films.length - 1].rank) {
						insertFilm()
					} else {
						var filmToChange = getByRank(films, rank)
						while (filmToChange) {
							var nextFilmToChange = getByRank(films, filmToChange.rank+1)
							filmToChange.rank += 1
							var filmToChange = nextFilmToChange
						}
						insertFilm()
					}
				}
				
				// make sure the array is sorted by rank after each addition.
				films.sort(function(a, b){
					return a.rank-b.rank
				})
			}
		
			//constructor for individual films, as we will make multiple
			function Film(title, director, year, rank) {
				// nothing fancy for property initialization.
				// You could do a check to see if title was falsey, but we check it when we click the add button instead.
				this.title = title
				this.director = director
				this.year = year
				this.rank = rank
			}
		
			// method to move the film after it has been inserted
			Film.prototype.move = function(direction) {
				
				list = document.getElementById("list")
				filmElement = document.querySelector("li[value=\"" + this.rank + "\"]")
				
				// move the element down in the DOM
				if (direction == "down") {
					// get the next element.
					nextFilmElement = getElementSibling(filmElement, "nextSibling")
					// if there is a next element to retrieve, get the object with rank exactly one more than the event target.
					if (nextFilmElement) {
						var nextFilmObj = getByRank(films, this.rank+1)
						// if the object exists, decrease its rank by 1, and rearrange the elements.
						if (nextFilmObj) {
							nextFilmObj.rank -= 1
							if (nextFilmElement.value == this.rank+1) {
								// get the element after the next element, because we are using insertBefore.
								secondSibling = nextFilmElement.nextSibling
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
				} else if (filmElement.value != 1) {
					// get the previous element.
					previousFilmElement = getElementSibling(filmElement, "previousSibling")
					// if there is a previous element to retrieve, get the object with rank exactly one less than the event target.
					if (previousFilmElement) {
						var previousFilmObj = getByRank(films, this.rank-1)
						// if the object exists, increase its rank by 1, and rearrange the elements.
						if (previousFilmObj) {
							previousFilmObj.rank += 1
							if (previousFilmElement.value == this.rank-1) {
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
				
				// make sure the array is properly sorted.
				films.sort(function(a, b){
					return a.rank-b.rank
				})
			}
		
			// method to add the object data to the DOM added the the prototype of Film.
			Film.prototype.addToDOM = function() {
				list = document.getElementById("list")
				li = document.createElement("li")
				li.innerHTML = this.title
				
				// make the number in the ordered list the proper rank.
				li.value = this.rank
				
				// if there is a year, add it in parenthesis to the title.
				if (this.year != undefined && this.year != null && this.year != "") {
					li.innerHTML += " (" + this.year + ")"
				}
				// check rank before inserting the list item into the DOM
				// If its the highest numerical rank, just add it to the end of the list.
				if (this.rank > films[films.length-1].rank) {
					list.appendChild(li)
					
				// if the rank is 1, insert at the top of the list and increase the rank of each item beneath.
				} else if (this.rank == 1) {
					listItems = document.querySelectorAll("#list li")
					var valueCheck = 1
					for (var p in listItems) {
						if (listItems[p].value != valueCheck) {
							break
						}
						listItems[p].value += 1
						valueCheck++
					}
					list.insertBefore(li, list.firstChild)
				// Otherwise, increase the rank of each item beneath, and add in the appropriate slot.
				} else {
					listItems = document.querySelectorAll("#list li")
					var valueCheck = this.rank
					for (var p in listItems) {
						if (listItems[p].value > valueCheck + 1) {
							break
						} else if (listItems[p].value == valueCheck) {
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
				if (this.director != undefined && this.director != null && this.director != "") {
					director = document.createElement("span")
					director.className = "director"
					director.innerHTML = "directed by " + this.director
					li.appendChild(document.createElement("br"))
					li.appendChild(director)
				}
				
				// finally, add links to move the item up or down.
				var movementLinks = document.createElement('p')
				movementLinks.className = 'movement-links'

				function createMoveLink(text,direction) {
					var moveLink = document.createElement('a')
					moveLink.innerHTML = text
					moveLink.href = '#'
					moveLink.onclick = function(event){
						event.preventDefault()
						currentFilmRank = event.target.parentElement.parentElement.value
						filmObject = getByRank(films, currentFilmRank)
						filmObject.move(direction)
					}
					movementLinks.appendChild(moveLink)
					return moveLink
				}

				createMoveLink('&#8593\; move up', 'up')
				createMoveLink('&#8595\; move down', 'down')

				li.appendChild(movementLinks)
			}
			
			// simple function for finding the correct object in the films array.
			function getByRank(theArray, value) {
			  for (var i=0; i < theArray.length; i++) {
			    if (theArray[i].rank == value) return theArray[i]
			  }
			}
		
			// simple function to find adjacent siblings while avoiding whitespace and other non-elements.
			function getElementSibling(element, nextOrPrevious){
			    do {
			        element = element[nextOrPrevious]
			    } while ( element && element.nodeType !== 1 )
			    return element
			}
			
			// function produces an error messag within the DOM instead of an alert dialog box.
			function errorMessage(message) {
				var element = document.querySelector("p.alert")
				element.innerHTML = message
				element.style.backgroundColor = 'red'
				var op = 1;  // initial opacity
				element.style.opacity = 1
				
				// setTimeout waits 3/4s of a second then slowly fades the p.alert element out using setInterval.
				setTimeout(function() {
					var timer = setInterval(function() {
						if (op <= 0.01) {
							clearInterval(timer)
							element.style.backgroundColor = 'white'
						}
						element.style.opacity = op
						element.style.filter = 'alpha(opacity=' + op * 100 + ")"
						op -= op * 0.1
					}, 50)
				}, 750)
			}
		}
	}
})()

window.onload = FilmList.init
