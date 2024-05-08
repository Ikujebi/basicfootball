function addPlayer() {
    let playerName = document.getElementById("playerName").value;
    
    if (playerName) {
        
        let teamNumber = Math.floor(Math.random() * 4) + 1; 
        let teamId = "team" + teamNumber;
        let teamList = document.getElementById(teamId).querySelector("ul");
        let listItem = document.createElement("li");
        listItem.textContent = playerName;
        teamList.appendChild(listItem);

       
        document.getElementById("playerName").value = ""
    }
}

function randomizePlayers() {
    const teamLists = document.querySelectorAll("ul");
    const allPlayers = [];

    teamLists.forEach(function(teamList) {
        Array.from(teamList.children).forEach(function(player) {
            allPlayers.push(player.textContent);
        });
    });

    // Shuffle the players array
    allPlayers.sort(function() { return 0.5 - Math.random() });

    // Distribute players to teams
    const numTeams = teamLists.length;
    const playersPerTeam = Math.floor(allPlayers.length / numTeams);
    let playerIndex = 0;
    teamLists.forEach(function(teamList) {
        // Clear the team list
        teamList.innerHTML = "";

        // Add players to the team list
        for (let i = 0; i < playersPerTeam && playerIndex < allPlayers.length; i++) {
            const listItem = document.createElement("li");
            listItem.textContent = allPlayers[playerIndex++];
            teamList.appendChild(listItem);
        }
    });
}


document.getElementById("playerName").addEventListener("keypress", function(event) {
    // Check if the pressed key is Enter (key code 13)
    if (event.key === "Enter") {
        // Prevent the default action (form submission)
        event.preventDefault();
        // Call the addPlayer function
        addPlayer();
    }
});


