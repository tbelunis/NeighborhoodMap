/**
 * Created by tom on 11/5/15.
 */
var model = {
    places: [
        {
            name: 'Maine Narrow Gauge Railroad',
            lat: 43.662333,
            lng: -70.243351
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
            lng: -70.251036
        },
        {
            name: 'Bayou Kitchen',
            lat: 43.670450,
            lng: -70.284195
        },
        {
            name: 'Veranda Thai Cuisine',
            lat: 43.680542,
            lng: -70.257118
        },
        {
            name: 'Little Tap House',
            lat: 43.653080,
            lng: -70.262272
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
            lng: -70.27584
        }
    ]
};

function ViewModel() {
    var self = this;

    self.searchQuery = ko.observable("");
    self.visiblePlaces = ko.observableArray([]);
    self.allPlaces = [];
    self.myMap = undefined;

    self.initialize = function() {
        var mapCanvas = document.getElementById('map');
        var mapOptions = {
            center: new google.maps.LatLng(43.6553, -70.2768),
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        self.myMap = new google.maps.Map(mapCanvas, mapOptions);

        self.allPlaces = model.places;
        //self.loadVisiblePlaces();
        //self.addMarkers();
        //var place = self.allPlaces[3];
        //var marker1 = new google.maps.Marker({
        //    position: new google.maps.LatLng(place.lat, place.lng)
        //});
        //marker1.setMap(self.myMap);
        //marker1.setVisible(true);
    };

    self.loadVisiblePlaces = function() {
        if (self.searchQuery() == "") {
            for (var i = 0; i < self.allPlaces.length; i++) {
                self.visiblePlaces.push(model.places[i]);
                //console.log("Added " + self.visiblePlaces()[i].name);
            }
        }
        console.log("Visible Places Length = " + self.visiblePlaces().length);
    };

    self.addMarkers = function () {
        for (var i = 0; i < self.visiblePlaces().length; i++) {
            //console.log(self.visiblePlaces()[i].name + ", " + self.visiblePlaces()[i].latlng.lat);
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(self.visiblePlaces()[i].lat, self.visiblePlaces()[i].lng),
                map: self.myMap,
                title: self.visiblePlaces()[i].name
            });
        }
    };

}

function initialize() {
    var vm = new ViewModel();
    ko.applyBindings(vm);
    vm.initialize();
    vm.loadVisiblePlaces();
    vm.addMarkers();
}