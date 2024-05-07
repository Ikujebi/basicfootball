function addPlayer() {
    let playerName = document.getElementById("playerName").value;
    console.log("ydygcdygcduuuuugduuduu");
    if (playerName) {
        
        let teamNumber = Math.floor(Math.random() * 4) + 1; // Random number between 1 and 4
        let teamId = "team" + teamNumber;
        let teamList = document.getElementById(teamId).querySelector("ul");
        let listItem = document.createElement("li");
        listItem.textContent = playerName;
        teamList.appendChild(listItem);

       
        document.getElementById("playerName").value = ""
    }
}

function randomizePlayers() {
    var allPlayers = [];
    var teamLists = document.querySelectorAll("ul");
    teamLists.forEach(function(teamList) {
        Array.from(teamList.children).forEach(function(player) {
            allPlayers.push(player.textContent);
        });
        teamList.innerHTML = ""; // Clear the team list
    });

    // Shuffle the players array
    allPlayers.sort(function() { return 0.5 - Math.random() });

    // Distribute players to teams
    var numTeams = teamLists.length;
    var playersPerTeam = Math.ceil(allPlayers.length / numTeams);
    for (var i = 0; i < allPlayers.length; i += playersPerTeam) {
        for (var j = 0; j < numTeams; j++) {
            var playerName = allPlayers[i + j];
            if (playerName) {
                var teamId = "team" + (j + 1);
                var teamList = document.getElementById(teamId).querySelector("ul");
                var listItem = document.createElement("li");
                listItem.textContent = playerName;
                teamList.appendChild(listItem);
            }
        }
    }
}