/**
 * Created by tom on 11/5/15.
 */
var model = {
    places: [
        {
            name: 'Maine Narrow Gauge Railroad',
            lat: 43.662333,
            lng: -70.243351,
            flickrText: 'Maine+narrow+gauge+railroad+portland+maine'
        },
        {
            name: 'Fort Allen Park',
            lat: 43.665579,
            lng: -70.240167
        },
        {
            name: 'Deering Oaks Park',
            lat: 43.659024,
            lng: -70.270761
        },
        {
            name: 'Eventide Oyster Company',
            lat: 43.659705,
            lng: -70.251036,
            placeId: 'ChIJeYjFM0CcskwRsZijjFhjOYE'
        },
        {
            name: 'Bayou Kitchen',
            lat: 43.670450,
            lng: -70.284195,
            placeId: 'ChIJJSD2zI-bskwRywtim1tbz6s'
        },
        {
            name: 'Veranda Thai Cuisine',
            lat: 43.680542,
            lng: -70.257118,
            placeId: 'ChIJ35OZyYacskwR3q1HVe00i9I'
        },
        {
            name: 'Little Tap House',
            lat: 43.653080,
            lng: -70.262272,
            placeId: 'ChIJBXIVtxacskwRHZ9Py-ZKnxk'
        },
        {
            name: 'Eastern Promenade',
            lat: 43.669977,
            lng: -70.246750
        },
        {
            name: 'Portland Observatory',
            lat: 43.665410,
            lng: -70.248275
        },
        {
            name: 'Western Promenade',
            lat: 43.647671,
            lng: -70.27584,
            flickrText: 'western+promenade+portland+maine'
        }
    ]
};

function ViewModel() {
    var self = this;

    self.searchQuery = ko.observable('');

    self.visiblePlaces = ko.observableArray();
    self.myMap = undefined;
    self.infoWindow = undefined;
    self.placesService = undefined;

    self.initialize = function() {
        var mapCanvas = document.getElementById('map-canvas');
        var mapOptions = {
            center: new google.maps.LatLng(43.6553, -70.2768),
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        self.myMap = new google.maps.Map(mapCanvas, mapOptions);

        self.allPlaces = model.places;

        self.allPlaces.forEach(function(place){
            self.visiblePlaces.push(place);
        });
        self.infoWindow = new google.maps.InfoWindow();
    };

   self.toggleColor = function(marker) {
        self.visiblePlaces().forEach(function(place){
            place.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
        });
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
    };

    self.filterMarkers = function() {
        var searchInput = self.searchQuery().toLowerCase();

        self.visiblePlaces.removeAll();
        self.infoWindow.close();

        self.allPlaces.forEach(function(place) {
            place.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
            place.marker.setVisible(false);

            if (place.name.toLowerCase().indexOf(searchInput) >= 0) {
                self.visiblePlaces.push(place);
            }
        });

        self.visiblePlaces().forEach(function(place) {
            place.marker.setVisible(true);
        });
    };

    self.addMarkers = function () {
        for (var i = 0; i < self.visiblePlaces().length; i++) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(self.visiblePlaces()[i].lat, self.visiblePlaces()[i].lng),
                map: self.myMap,
                title: self.visiblePlaces()[i].name
            });
            google.maps.event.addListener(marker, 'click', (function(markerCopy) {
                return function() {
                    self.toggleColor(markerCopy);
                    markerCopy.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
                    self.infoWindow.setContent("<p>" + markerCopy.title + "</p>");
                    self.infoWindow.open(self.myMap, markerCopy);

                };
            })(marker));
            self.visiblePlaces()[i].marker = marker;
        }
    };

    self.placeClicked = function(place) {
        self.toggleColor(place.marker);
        self.fetchPhotosForPlace(place);
        //self.infoWindow.setContent("<p>" + place.marker.title + "</p>");
        //self.infoWindow.open(self.myMap, place.marker);
        return true;
    };

    self.fetchPhotosForPlace = function(place) {
        var flickrApi = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=7621f55caf1ebb0d151f08771fbaee29&extras=url_m&format=json&jsoncallback=?" +
            "&text=" + self.placeNameToSearchText(place);
        //$.ajax({
        //    url: flickrApi,
        //    cache: true,
        //    dataType: 'jsonp',
        //    success: function(data) {
        //        console.log(data.photos.photo[0].url_m);
        //    }
        //});
        $.getJSON(flickrApi, {})
            .done(function (data) {
                console.log("Data returned from flickr");
                //$.each(data.photos, function (i, photo) {
                //    content = content + $("<img>").attr("src", photo.url_m);
                //    if (i === 3) {
                //        return false;
                //    }
                //});
                var content = '<p>' + place.name + '</p><img src="' + data.photos.photo[0].url_m + '" />';
                self.infoWindow.setContent(content);
                self.infoWindow.open(self.myMap, place.marker);
            });
    };

    self.placeNameToSearchText = function(place) {
        var placeString = place.name + " portland maine";
        var words = placeString.split(" ");
        return words.join("+");
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

function initialize() {
    var vm = new ViewModel();
    ko.applyBindings(vm);
    vm.initialize();
    vm.addMarkers();
}