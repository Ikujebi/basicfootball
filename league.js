document.addEventListener("DOMContentLoaded", function() {
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function () {
            console.log("Button found!");
            calculateGDAndPoints();
            arrangeTeamsByPoints();
        });
    } else {
        console.error("Button not found!");
    }

    function setupLeagueTable(numTeams) {
        const leagueTeams = document.getElementById('league-teams');
        leagueTeams.innerHTML = "";

        for (let i = 0; i < numTeams; i++) {
            const teamName = prompt("Enter name for Team " + String.fromCharCode(65 + i), "Team " + String.fromCharCode(65 + i));
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${teamName}</td>
                <td><input type="number" class="played" name="played[]" value="0"></td>
                <td><input type="number" class="won" name="won[]" value="0"></td>
                <td><input type="number" class="drawn" name="drawn[]" value="0"></td>
                <td><input type="number" class="lost" name="lost[]" value="0"></td>
                <td><input type="number" class="gf" name="gf[]" value="0"></td>
                <td><input type="number" class="ga" name="ga[]" value="0"></td>
                <td><input type="number" class="gd" name="gd[]" value="0" readonly></td>
                <td><input type="number" class="points" name="points[]" value="0" readonly></td>
            `;
            leagueTeams.appendChild(newRow);
        }
    }

    function calculateGDAndPoints() {
        const rows = document.querySelectorAll('.table_container tbody tr');

        rows.forEach(row => {
            const played = parseInt(row.querySelector('.played').value);
            const won = parseInt(row.querySelector('.won').value);
            const drawn = parseInt(row.querySelector('.drawn').value);
            const lost = parseInt(row.querySelector('.lost').value);
            const gf = parseInt(row.querySelector('.gf').value);
            const ga = parseInt(row.querySelector('.ga').value);

            const gd = gf - ga;
            row.querySelector('.gd').value = gd;

            const points = (won * 3) + (drawn * 1);
            row.querySelector('.points').value = points;
        });
    }

    function arrangeTeamsByPoints() {
        const tbody = document.querySelector('.table_container tbody');
        const rowsArray = Array.from(tbody.querySelectorAll('tr'));
        console.log(rowsArray); 
        rowsArray.sort((a, b) => {
            const pointsA = parseInt(a.querySelector('.points').value);
            const pointsB = parseInt(b.querySelector('.points').value);
            return pointsB - pointsA;
        });

        rowsArray.forEach(row => {
            tbody.appendChild(row);
        });
    }

    const numTeams = parseInt(prompt("Enter the number of teams for the league:", "4"));
    if (!isNaN(numTeams) && numTeams > 0) {
        setupLeagueTable(numTeams);
    } else {
        alert("Please enter a valid number of teams.");
    }
});
