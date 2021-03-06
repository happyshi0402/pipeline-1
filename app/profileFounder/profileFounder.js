var app = angular.module('founder', ['ui.bootstrap', 'angular-growl']);

// sets theme for xeditable
app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme
});

app.controller('profileFounderCtrl', [
  '$scope',
  'founderProfileFactory',
  'noteInfoFactory',
  'fullContactPersonFactory',
  '$stateParams',
  'growl',
  function($scope, founderProfileFactory, noteInfoFactory, fullContactPersonFactory, $stateParams, growl) {

    var founderId = $stateParams.founderId;

    // callback for firebase set method
    var onComplete = function(error) {
      if (error) {
        console.log('Error: ' + error);
      } else {
        growl.success($scope.name + ' updated', {ttl: 3000});
        console.log('Synchronization succeeded');
      }
    };

    // update founder object via x-editable
    $scope.updateFounder = function(update) {
      // set all fields that have no values to null so we don't send undefined to firebase
      for (key in update) {
        if (update[key] === undefined) {
          update[key] = null;
        }
      }

      var founderRef = new Firebase('https://pipeline8.firebaseio.com/founder/');
      var founder = founderRef.child(founderId);
      $scope.name = update.name;
      founder.set(update, onComplete);
    };

    // update individual notes object via x-editable
    $scope.updateNotes = function(update) {
      $scope.notesIndex.$save(update).then(function(ref) {
        ref.key() === update.$id; // true
        growl.success('Note updated!', {ttl: 3000});
      },

      function(error) {
        console.log('Error:', error);
      });
    };

    // status dropdown options for x-editable
    $scope.statuses = [
      {text: 'No status'},
      {text: 'Past due'},
      {text: 'Requires immediate action'},
      {text: 'To do'},
      {text: 'Just a reminder'},
      {text: 'Completed'},
    ];

    // Get founder information via factory
    $scope.getProfile = function() {
      founderProfileFactory.getFounder(founderId).then(function(returnedData) {

        // assign factory's founder obj & founder id to scope
        $scope.founder = returnedData;
        $scope.founder.id = founderId;

        // Check if notes object exists within founder
        if ($scope.founder.notes) {

          // assign notes key's within founder to own variable
          $scope.notesArr = Object.keys($scope.founder.notes);

          // call getNotes
          $scope.getNotes($scope.notesArr);
        };

        // Check if startups object exists within founder
        if ($scope.founder.startups) {

          // assign startups key's within founder to own variable
          var startupsArr = Object.keys($scope.founder.startups);

          // call getStartups
          $scope.getStartups(startupsArr);
        };
      });
    };

    // Get notes via factory
    $scope.getNotes = function(notes) {
      founderProfileFactory.getNotes(notes).then(function(returnedData) {
        $scope.notesIndex = returnedData;

        // array to store notes specific to this startup
        $scope.notes = [];

        // search notesIndex for keys stored in notesArr and
        // push associated record to $scope.notes
        $scope.notesArr.forEach(function(name) {
          if ($scope.notesIndex.$getRecord(name)) {
            $scope.notes.push($scope.notesIndex.$getRecord(name));
          }
        });
      });
    };

    // Get startups via factory
    $scope.getStartups = function(startups) {
      founderProfileFactory.getStartups(startups).then(function(returnedData) {
        $scope.startups = returnedData;
      });
    };

    // Invoke inital method to get founder info
    $scope.getProfile();

    // here we will store the persons social profiles as an object
    $scope.fullContactSocialProfiles = {};

    // GET req for FullContact Person API (by email address)
    $scope.getFullContact = function(personEmail) {
      fullContactPersonFactory.getPerson(personEmail)
      .then(function(returnedData) {

        // assign returned data to $scope
        $scope.fullContact = returnedData;

        // convert person's social profile list from an array to object
        returnedData.socialProfiles.forEach(function(profile, index) {
          $scope.fullContactSocialProfiles[profile.type] = profile;
        });
      }).catch(function(error) {
        console.log(error);
      });
    };

    // controls 'Add Note' on profile page; pass through info listed in the row
    $scope.open = function(founderName, founderId) {
      noteInfoFactory.getRow(null, null, founderName, founderId);
    };
  },
]);
