'use strict';
/**
 * Created by tom on 11/5/15.
 **/

// Global variables for map and infowindow
var map;
var infoWindow;


var clientId = 'X3UYVL1QCSRGJXWW00M3UYNGQ1FX3W00PMRQMAOV22LDJHGW';
var clientSecret = 'TNI1UYYG0JRIGQE31AIQ2FHPOHE2ZHN2DA4TGW2B4WOB30W0';
var foursquareAPIBaseUrl = 'https://api.foursquare.com/v2/venues/';
var foursquareVersion = '20151129';

// ViewModel
var vm;


function createInfoWindowContent(place) {
    console.log(place);
    var content = '<div id=info>' +
        '<h4>' + place.name + '</h4>';

    if (place.shouldShowRating) {
        content = content.concat('<p>FourSquare Rating: ' + place.rating + '</p>');
    }

    if (place.status) {
        var cssClass = place.isOpen ? "status-open" : "status-closed";
        content = content.concat('<div class=' + cssClass + '>');
        content = content.concat('<p>' + place.status + '</p>');
        content = content.concat('</div>');
    }

    if (place.url) {
        content = content.concat('<a href=' + place.url + '>' + place.url +'</a>');
    }

    content = content.concat('<p>Powered by FourSquare');

    return content;

}

function toggleBounce(marker) {
    /*
     * Set the animating, stop it
     */
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
        /*
         * Else animate with bounce
         */
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
    }
}

function showInfoWindow(marker, place) {

    var foursquareAPICall = foursquareAPIBaseUrl +
        place.venueId +
        '?client_id=' + clientId +
        '&client_secret=' + clientSecret +
        '&v=' + foursquareVersion;

    $.ajax({
        url: foursquareAPICall,
        cache: true,
        dataType: 'jsonp',
        success: function (data) {
            var venue = data.response.venue;
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
            // set the value of the url for the this.
            if (typeof venue.url != "undefined") {
                place.url = venue.url;
            } else {
                place.url = undefined;
            }

            var content = createInfoWindowContent(place);
            //console.log(content);
            toggleBounce(marker);
            setTimeout(function(){ toggleBounce(marker); }, 1400);
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        },
        error: function(e) {
            vm.errorMessage('Could not retrieve venue data from Foursquare');
        }
    });

}

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

    var latLng = new google.maps.LatLng(this.latitude, this.longitude);
    this.marker = new google.maps.Marker({
        position: latLng,
        map: map,
        title: this.name
    });
    var self = this;

    window.mapBounds.extend(latLng);
    google.maps.event.addListener(self.marker, 'click', (function(marker, place) {
        //console.log(self);
        return function() {
            showInfoWindow(marker,place);
        };
    })(this.marker, self));

    map.fitBounds(window.mapBounds);
    map.setCenter(window.mapBounds.getCenter());
}

// Hardcoded places for the map
// Each place has a name, latitude, longitude, and a FourSquare venue id
// that will be used to get information about the venue in a
// FourSquare API call
function Model() {
    this.places = [
        new Place('Bard Coffee', 43.657638, -70.255206, '4ac0dc1ef964a520bf9420e3'),
        new Place('Arabica Coffee Company', 43.659189, -70.248933, '4f6dec4de4b0ad1af4ef661f'),
        new Place('Dobra Tea', 43.658282, -70.255249, '4d31f181b6093704b772f1df'),
        new Place('Eventide Oyster Company', 43.659705, -70.251036, '4fd9e1f9d5fb0913decc6c9c'),
        new Place("Pom's Thai Taste", 43.655030, -70.262442, '4aabda64f964a520735a20e3'),
        new Place('Little Tap House', 43.653080, -70.262272, '514fa6975262217c60aaaa52'),
        new Place("Captain Sam's Ice Cream", 43.656175, -70.251503, '4fb2a422e4b0a0d79a9e1ae0'),
        new Place('BaoBao Dumpling House', 43.652646, -70.263007, '544091cc498e405221d39a2a'),
        new Place('Otto Pizza', 43.654639, -70.262207, '4b2c3381f964a520a2c324e3')
    ];
}

function initializeMap() {
    var mapCanvas = document.getElementById('map-canvas');
    // Create a Google map centered on downtown Portland, ME
    var mapOptions = {
        center: new google.maps.LatLng(43.655383, -70.257807),
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(mapCanvas, mapOptions);
    infoWindow = new google.maps.InfoWindow();
    window.mapBounds = new google.maps.LatLngBounds();
}

// The ViewModel for Knockout.js
function ViewModel() {
    var self = this;

    // User-inputted search string
    self.searchQuery = ko.observable('');

    // The filtered list of places
    self.visiblePlaces = ko.observableArray();

    // The selected place for the InfoWindow
    self.currentPlace = ko.observable();
    self.currentPlace.extend({ notify: 'always' });

    self.errorMessage = ko.observable('');

    // Initialize function
    self.initialize = function() {
        self.allPlaces = new Model().places;

        // Initially all the places are visible
        self.allPlaces.forEach(function(place){
            self.visiblePlaces.push(place);
        });
    };


    // Filter the list of places and markers based on the input in
    // the search box.
    self.filterPlaces = function() {
        var searchInput = self.searchQuery().toLowerCase();

        // Clear out the array of visible places and
        // close the InfoWindow
        self.visiblePlaces.removeAll();
        infoWindow.close();

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

    // Finds the place associated with the marker and
    // calls the self.placeClicked function with that place.
    self.clickPlaceFromMarker = function(marker) {
        self.allPlaces.forEach(function (place) {
            if (marker === place.marker) {
                self.placeClicked(place);
            }
        });
    };

    // Show the infowindow when a place in the list is clicked.
    self.placeClicked = function(place) {
        showInfoWindow(place.marker, place);
        return true;
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
    initializeMap();
    vm = new ViewModel();
    ko.applyBindings(vm);
    vm.initialize();
}