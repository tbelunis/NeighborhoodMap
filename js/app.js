/**
 * Created by tom on 11/5/15.
 **/

function Place(name, latitude, longitude, venueId) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.venueId = venueId;
}
var model2 = {
    places: [
        new Place('Bard Coffee', 43.657638, -70.255206, '4ac0dc1ef964a520bf9420e3'),
        new Place('Arabica Coffee Company', 43.659189, -70.248933, '4f6dec4de4b0ad1af4ef661f'),
        new Place('Dobra Tea', 43.658282, -70.255249, '4ac0dc1ef964a520bf9420e3'),
        new Place('Eventide Oyster Company', 43.659705, -70.251036, '4fd9e1f9d5fb0913decc6c9c'),
        new Place("Pom's Thai Taste", 43.655030, -70.262442, '4aabda64f964a520735a20e3'),
        new Place('Little Tap House', 43.653080, -70.262272, '514fa6975262217c60aaaa52'),
        new Place("Captain Sam's Ice Cream", 43.656175, -70.251503, '4fb2a422e4b0a0d79a9e1ae0'),
        new Place('BaoBao Dumpling House', 43.652646, -70.263007, '544091cc498e405221d39a2a'),
        new Place('Otto Pizza', 43.654639, -70.262207, '4b2c3381f964a520a2c324e3')
    ]
};

var model = {
    places: [
        {
            name: 'Bard Coffee',
            lat: 43.657638,
            lng: -70.255206,
            venueId: '4ac0dc1ef964a520bf9420e3'
        },
        {
            name: 'Arabica Coffee Company',
            lat: 43.659189,
            lng: -70.248933,
            venueId: '4f6dec4de4b0ad1af4ef661f'
        },
        {
            name: 'Dobra Tea',
            lat: 43.658282,
            lng: -70.255249,
            venueId: '4d31f181b6093704b772f1df'
        },
        {
            name: 'Eventide Oyster Company',
            lat: 43.659705,
            lng: -70.251036,
            venueId: '4fd9e1f9d5fb0913decc6c9c'
        },
        {
            name: "Pom's Thai Taste",
            lat: 43.655030,
            lng: -70.262442,
            venueId: '4aabda64f964a520735a20e3'
        },
        {
            name: 'Little Tap House',
            lat: 43.653080,
            lng: -70.262272,
            venueId: '514fa6975262217c60aaaa52'
        },
        {
            name: "Captain Sam's Ice Cream",
            lat: 43.656175,
            lng: -70.251503,
            venueId: '4fb2a422e4b0a0d79a9e1ae0'
        },
        {
            name: 'BaoBao Dumpling House',
            lat: 43.652646,
            lng: -70.263007,
            venueId: '544091cc498e405221d39a2a'
        },
        {
            name: 'Otto Pizza',
            lat: 43.654639,
            lng: -70.262207,
            venueId: '4b2c3381f964a520a2c324e3'
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
    self.currentPlace = ko.observable();

    self.initialize = function() {
        var mapCanvas = document.getElementById('map-canvas');
        var mapOptions = {
            center: new google.maps.LatLng(43.655383, -70.257807),
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        self.myMap = new google.maps.Map(mapCanvas, mapOptions);

        self.allPlaces = model2.places;

        self.allPlaces.forEach(function(place){
            self.visiblePlaces.push(place);
        });
        var infoWindowHTML = '<div id="info-window"' +
            'data-bind="template: { name: \'info-window-template\', data: currentPlace }">' +
                '</div>';
        self.infoWindow = new google.maps.InfoWindow({
            content: infoWindowHTML
        });
        var isInfoWindowLoaded = false;
        google.maps.event.addListener(self.infoWindow, 'domready', function() {
            if (!isInfoWindowLoaded) {
                ko.applyBindings(self, $("#info-window")[0]);
                isInfoWindowLoaded = true;
            }
        })
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
                position: new google.maps.LatLng(self.visiblePlaces()[i].latitude, self.visiblePlaces()[i].longitude),
                map: self.myMap,
                title: self.visiblePlaces()[i].name
            });
            google.maps.event.addListener(marker, 'click', (function(markerCopy) {
                return function() {
                    self.toggleColor(markerCopy);
                    markerCopy.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
                    //self.infoWindow.setContent("<p>" + markerCopy.title + "</p>");
                    self.placeFromMarker(markerCopy);
                    self.infoWindow.open(self.myMap, markerCopy);

                };
            })(marker));
            self.visiblePlaces()[i].marker = marker;
        }
    };

    self.placeFromMarker = function(marker) {
        self.allPlaces.forEach(function (place) {
            if (marker === place.marker) {
                self.currentPlace(place);
            }
        })
    };

    self.placeClicked = function(place) {
        self.toggleColor(place.marker);
        self.fetchFourSquareDataForPlace(place);
        self.currentPlace(place);
        //self.infoWindow.setContent("<p>" + place.marker.title + "</p>");
        self.infoWindow.open(self.myMap, place.marker);
        return true;
    };

    self.fetchFourSquareDataForPlace = function(place) {
        var foursquareApi = "https://api.foursquare.com/v2/venues/" + place.venueId +
            "?client_id=X3UYVL1QCSRGJXWW00M3UYNGQ1FX3W00PMRQMAOV22LDJHGW" +
            "&client_secret=TNI1UYYG0JRIGQE31AIQ2FHPOHE2ZHN2DA4TGW2B4WOB30W0" +
            "&v=20151129";
        //+ self.placeNameToSearchText(place);
        $.ajax({
            url: foursquareApi,
            cache: true,
            dataType: 'jsonp',
            success: function(data) {
                console.log(data);
                var venue = data.response.venue;

            }
        });
        //$.getJSON(foursquareApi, {})
        //    .done(function (data) {
        //        console.log("Data returned from FourSquare");
        //        //$.each(data.photos, function (i, photo) {
        //        //    content = content + $("<img>").attr("src", photo.url_m);
        //        //    if (i === 3) {
        //        //        return false;
        //        //    }
        //        //});
        //        var content = '<p>' + place.name + '</p><img src="' + data.photos.photo[0].url_m + '" />';
        //        self.infoWindow.setContent(content);
        //        self.infoWindow.open(self.myMap, place.marker);
        //    });
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