/**
 * Created by tom on 11/5/15.
 **/

// Constructor for new Place objects
function Place(name, latitude, longitude, venueId) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.venueId = venueId;
    this.isOpen = undefined;
    this.rating = undefined;
    this.status = undefined;
    this.shouldShowRating = false;
}

// If the data returned from FourSquare includes hours
// return true so the knockout visible binding can
// determine whether or not to display the div in the
// InfoWindow
Place.prototype.shouldShowOpenStatus = function () {
    return this.isOpen !== undefined;
};

// Returns the css class to use in the InfoWindow
// template, green text if currently open, red if closed
Place.prototype.openStatus = function() {
    return this.isOpen ? "status-open" : "status-closed";
};

// Hardcoded places for the map
// Each place has a name, latitude, longitude, and a FourSquare venue id
// that will be used to get information about the venue in a
// FourSquare API call
var model = {
    places: [
        new Place('Bard Coffee', 43.657638, -70.255206, '4ac0dc1ef964a520bf9420e3'),
        new Place('Arabica Coffee Company', 43.659189, -70.248933, '4f6dec4de4b0ad1af4ef661f'),
        new Place('Dobra Tea', 43.658282, -70.255249, '4d31f181b6093704b772f1df'),
        new Place('Eventide Oyster Company', 43.659705, -70.251036, '4fd9e1f9d5fb0913decc6c9c'),
        new Place("Pom's Thai Taste", 43.655030, -70.262442, '4aabda64f964a520735a20e3'),
        new Place('Little Tap House', 43.653080, -70.262272, '514fa6975262217c60aaaa52'),
        new Place("Captain Sam's Ice Cream", 43.656175, -70.251503, '4fb2a422e4b0a0d79a9e1ae0'),
        new Place('BaoBao Dumpling House', 43.652646, -70.263007, '544091cc498e405221d39a2a'),
        new Place('Otto Pizza', 43.654639, -70.262207, '4b2c3381f964a520a2c324e3')
    ]
};

// The ViewModel for Knockout.js
function ViewModel() {
    var self = this;

    // User-inputted search string
    self.searchQuery = ko.observable('');

    // The filtered list of places
    self.visiblePlaces = ko.observableArray();

    // The selected place for the InfoWindow
    self.currentPlace = ko.observable();

    self.myMap = undefined;
    self.infoWindow = undefined;

    // Initialize function
    self.initialize = function() {
        var mapCanvas = document.getElementById('map-canvas');
        // Create a Google map centered on downtown Portland, ME
        var mapOptions = {
            center: new google.maps.LatLng(43.655383, -70.257807),
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        self.myMap = new google.maps.Map(mapCanvas, mapOptions);

        self.allPlaces = model.places;

        // Initially all the places are visible
        self.allPlaces.forEach(function(place){
            self.visiblePlaces.push(place);
        });

        // Set up the HTML for the InfoWindow using a
        // Knockout template
        var infoWindowHTML = '<div id="info-window"' +
            'data-bind="template: { name: \'info-window-template\', data: currentPlace }">' +
            '</div>';

        self.infoWindow = new google.maps.InfoWindow({
            content: infoWindowHTML
        });

        // Need to make sure the Knockout bindings are only applied once
        var isInfoWindowLoaded = false;

        // When the DOM of the InfoWindow is ready, apply the
        // Knockout bindings
        google.maps.event.addListener(self.infoWindow, 'domready', function() {
            if (!isInfoWindowLoaded) {
                ko.applyBindings(self, $("#info-window")[0]);
                isInfoWindowLoaded = true;
            }
        })
    };

    // Reset the color of all the visible map markers
    // to the standard Google red dot.
    self.resetMarkerColors = function () {
        self.visiblePlaces().forEach(function(place){
            place.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
        });
    };

    // Set the color of the selected marker to blue
    self.toggleColor = function(marker) {
        self.resetMarkerColors();
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
    };

    // Filter the list of places and markers based on the input in
    // the search box.
    self.filterPlaces = function() {
        var searchInput = self.searchQuery().toLowerCase();

        // Clear out the array of visible places and
        // close the InfoWindow
        self.visiblePlaces.removeAll();
        self.infoWindow.close();

        // Reset all the markers to red
        self.resetMarkerColors();

        // Iterate over all the places and make the marker invisible.
        // If the name of the place matches the search query, add
        // the place to the array of visible places.
        self.allPlaces.forEach(function(place) {
            place.marker.setVisible(false);
            if (place.name.toLowerCase().indexOf(searchInput) >= 0) {
                self.visiblePlaces.push(place);
            }
        });

        // Make the markers for the visible places visible
        self.visiblePlaces().forEach(function(place) {
            place.marker.setVisible(true);
        });
    };

    // Add the markers to the map as part of the initialization
    // of the app.
    self.addMarkers = function () {
        for (var i = 0; i < self.visiblePlaces().length; i++) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(self.visiblePlaces()[i].latitude, self.visiblePlaces()[i].longitude),
                map: self.myMap,
                title: self.visiblePlaces()[i].name
            });

            // Add a click listener to each marker. When the marker is clicked, determine
            // the place from the marker and execute the function that is called when
            // a place in the list is clicked.
            google.maps.event.addListener(marker, 'click', (function(markerCopy) {
                return function() {
                    self.clickPlaceFromMarker(markerCopy);
                };
            })(marker));
            self.visiblePlaces()[i].marker = marker;
        }
    };

    // Finds the place associated with the marker and
    // calls the self.placeClicked function with that place.
    self.clickPlaceFromMarker = function(marker) {
        self.allPlaces.forEach(function (place) {
            if (marker === place.marker) {
                self.placeClicked(place);
            }
        })
    };

    // Toggle the color for the marker for the place
    // that was clicked on and get the data from
    // FourSquare for that place.
    self.placeClicked = function(place) {
        self.toggleColor(place.marker);
        self.fetchFourSquareDataForPlace(place);
        return true;
    };

    // Call the FourSquare API to get the data for the place
    // using the place's venueId
    self.fetchFourSquareDataForPlace = function(place) {
        var foursquareApi = "https://api.foursquare.com/v2/venues/" + place.venueId +
            "?client_id=X3UYVL1QCSRGJXWW00M3UYNGQ1FX3W00PMRQMAOV22LDJHGW" +
            "&client_secret=TNI1UYYG0JRIGQE31AIQ2FHPOHE2ZHN2DA4TGW2B4WOB30W0" +
            "&v=20151129";

        // The AJAX call to FourSquare
        $.ajax({
            url: foursquareApi,
            cache: true,
            dataType: 'jsonp',
            success: function(data) {
                // Get the venue object from the response
                var venue = data.response.venue;
                // If a rating is present, get it and set
                // shouldShowRating to true.
                if (typeof venue.rating != "undefined") {
                    place.rating = venue.rating;
                    place.shouldShowRating = true;
                } else {
                    place.rating = undefined;
                    place.shouldShowRating = false;
                }

                // If the hours for the venue are present
                // get the isOpen flag and the status message
                if (typeof venue.hours != "undefined") {
                    place.isOpen = venue.hours.isOpen;
                    place.status = venue.hours.status;
                } else {
                    place.isOpen = false;
                    place.status = undefined;
                }

                // If the venue has a url associated with it
                // set the value of the url for the place.
                if (typeof venue.url != "undefined") {
                    place.url = venue.url;
                } else {
                    place.url = undefined;
                }

                // Set the ko.observable currentPlace to the
                // value of place so that the InfoWindow will
                // display the correct values.
                self.currentPlace(place);
                self.infoWindow.open(self.myMap, place.marker);
            }
        });

    };
}

$(document).ready(function() {
    var items;
    // Sidebar toggling on/off view on small screen
    // Sidebar slider code from http://www.codeply.com/go/bp/mL7j0aOINa
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });
    // Change active state for sidebar links when clicked
    $('li').click(function() {
        items = document.getElementsByTagName('li');
        for (var i = 0; i < items.length; i++) {
            items[i].className = '';
        }
        $(this).addClass('active');
    });
});

// Callback for the async loading of the Google maps API
function initialize() {
    // Create a new ViewModel, apply the Knockout bindings
    // and then initialize the ViewModel and add the markers
    // to the map.
    var vm = new ViewModel();
    ko.applyBindings(vm);
    vm.initialize();
    vm.addMarkers();
}