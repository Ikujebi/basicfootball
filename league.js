
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const STORAGE_KEY = "awarri_football_league_v2";

    const MIN_TEAMS = 2;
    const MAX_TEAMS = 30;


    // ==========================================
    // DOM ELEMENTS
    // ==========================================

    const elements = {
        setupForm: document.getElementById("setup-form"),
        numTeams: document.getElementById("numTeams"),
        leagueTeams: document.getElementById("league-teams"),
        leagueStatus: document.getElementById("league-status"),

        totalTeams: document.getElementById("total-teams"),
        totalMatches: document.getElementById("total-matches"),
        totalGoals: document.getElementById("total-goals"),
        leagueLeader: document.getElementById("league-leader"),

        exportBtn: document.getElementById("export-btn"),
        resetBtn: document.getElementById("reset-btn"),
        currentYear: document.getElementById("current-year")
    };


    // ==========================================
    // APPLICATION STATE
    // ==========================================

    let teams = [];


    // ==========================================
    // HELPERS
    // ==========================================

    function createTeam(index) {

        return {
            id: `team-${Date.now()}-${index}`,
            name: `Team ${String.fromCharCode(65 + index)}`,

            won: "0",
            drawn: "0",
            lost: "0",
            gf: "0",
            ga: "0"
        };
    }


    function escapeCSV(value) {

        const text = String(value ?? "");

        return `"${text.replace(/"/g, '""')}"`;
    }


    function getNumericValue(value) {

        if (
            value === "" ||
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const number = Number(value);

        if (
            !Number.isSafeInteger(number) ||
            number < 0
        ) {
            return null;
        }

        return number;
    }


    function getTeamStats(team) {

        const won = getNumericValue(team.won);
        const drawn = getNumericValue(team.drawn);
        const lost = getNumericValue(team.lost);
        const gf = getNumericValue(team.gf);
        const ga = getNumericValue(team.ga);

        const valid =
            won !== null &&
            drawn !== null &&
            lost !== null &&
            gf !== null &&
            ga !== null &&
            team.name.trim().length > 0;

        if (!valid) {
            return null;
        }

        const played = won + drawn + lost;
        const goalDifference = gf - ga;
        const points = (won * 3) + drawn;

        return {
            played,
            won,
            drawn,
            lost,
            gf,
            ga,
            goalDifference,
            points
        };
    }


    function isValidTeamName(team, allTeams) {

        const name = team.name.trim().toLowerCase();

        if (!name) return false;

        return allTeams.every(otherTeam => {

            if (otherTeam.id === team.id) return true;

            return otherTeam.name.trim().toLowerCase() !== name;
        });
    }


    function getSortedTeams() {

        return [...teams].sort((a, b) => {

            const statsA = getTeamStats(a);
            const statsB = getTeamStats(b);

            // Valid teams appear before invalid teams.
            if (statsA && !statsB) return -1;
            if (!statsA && statsB) return 1;

            if (!statsA || !statsB) {
                return a.name.localeCompare(b.name);
            }

            // 1. Highest points.
            if (statsA.points !== statsB.points) {
                return statsB.points - statsA.points;
            }

            // 2. Highest goal difference.
            if (
                statsA.goalDifference !== statsB.goalDifference
            ) {
                return statsB.goalDifference - statsA.goalDifference;
            }

            // 3. Highest goals scored.
            if (statsA.gf !== statsB.gf) {
                return statsB.gf - statsA.gf;
            }

            // 4. Alphabetical order.
            return a.name.localeCompare(b.name);
        });
    }


    // ==========================================
    // LOCAL STORAGE
    // ==========================================

    function saveLeague() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(teams)
            );

        } catch (error) {

            console.error("Unable to save league:", error);

            setStatus(
                "Unable to save changes. Check your browser storage settings.",
                "error"
            );
        }
    }


    function loadLeague() {

        try {

            const savedData = localStorage.getItem(STORAGE_KEY);

            if (!savedData) return false;

            const parsedData = JSON.parse(savedData);

            if (
                !Array.isArray(parsedData) ||
                parsedData.length < MIN_TEAMS ||
                parsedData.length > MAX_TEAMS
            ) {
                return false;
            }

            const validData = parsedData.every(team => {

                return (
                    team &&
                    typeof team.id === "string" &&
                    typeof team.name === "string" &&
                    typeof team.won === "string" &&
                    typeof team.drawn === "string" &&
                    typeof team.lost === "string" &&
                    typeof team.gf === "string" &&
                    typeof team.ga === "string"
                );
            });

            if (!validData) return false;

            teams = parsedData;

            return true;

        } catch (error) {

            console.error("Unable to load league:", error);

            return false;
        }
    }


    // ==========================================
    // STATUS MESSAGE
    // ==========================================

    function setStatus(message, type = "info") {

        elements.leagueStatus.textContent = message;

        elements.leagueStatus.className =
            `status-message status-${type}`;
    }


    // ==========================================
    // GENERATE LEAGUE
    // ==========================================

    function generateLeague(event) {

        event.preventDefault();

        const numberOfTeams = Number(elements.numTeams.value);

        if (
            !Number.isInteger(numberOfTeams) ||
            numberOfTeams < MIN_TEAMS ||
            numberOfTeams > MAX_TEAMS
        ) {

            setStatus(
                `Please enter between ${MIN_TEAMS} and ${MAX_TEAMS} teams.`,
                "error"
            );

            return;
        }


        if (teams.length > 0) {

            const confirmed = window.confirm(
                "Generating a new league will replace your current teams and statistics. Continue?"
            );

            if (!confirmed) return;
        }


        teams = Array.from(
            { length: numberOfTeams },
            (_, index) => createTeam(index)
        );


        saveLeague();

        renderLeague();

        setStatus(
            `${numberOfTeams} teams successfully created.`,
            "success"
        );
    }


    // ==========================================
    // RENDER LEAGUE TABLE
    // ==========================================

    function renderLeague() {

        elements.leagueTeams.innerHTML = "";

        const sortedTeams = getSortedTeams();

        sortedTeams.forEach((team, index) => {

            const stats = getTeamStats(team);

            const row = document.createElement("tr");

            row.dataset.teamId = team.id;

            if (!stats) {
                row.classList.add("invalid-row");
            }


            // Position
            const positionCell = document.createElement("td");

            const position = document.createElement("span");

            position.className = "position-badge";

            position.textContent = index + 1;

            if (index === 0 && stats) {
                position.classList.add("first-position");
            }

            positionCell.appendChild(position);


            // Team name
            const nameCell = document.createElement("td");

            nameCell.className = "team-column";

            const nameInput = document.createElement("input");

            nameInput.type = "text";
            nameInput.className = "team-name";
            nameInput.value = team.name;
            nameInput.maxLength = 40;
            nameInput.dataset.field = "name";
            nameInput.setAttribute("aria-label", "Team name");

            nameCell.appendChild(nameInput);


            // Editable statistics
            const editableFields = [
                "won",
                "drawn",
                "lost",
                "gf",
                "ga"
            ];

            const played = document.createElement("td");
            played.className = "calculated-cell";
            played.textContent = stats ? stats.played : "—";


            function createStatCell(field) {

                const cell = document.createElement("td");

                const input = document.createElement("input");

                input.type = "number";
                input.min = "0";
                input.step = "1";
                input.inputMode = "numeric";

                input.className = "stat-input";
                input.dataset.field = field;

                input.value = team[field];

                input.setAttribute(
                    "aria-label",
                    `${field.toUpperCase()} for ${team.name}`
                );

                cell.appendChild(input);

                return cell;
            }


            // Derived statistics
            function createCalculatedCell(value) {

                const cell = document.createElement("td");

                cell.className = "calculated-cell";

                cell.textContent = value ?? "—";

                return cell;
            }


            row.appendChild(positionCell);
            row.appendChild(nameCell);
            row.appendChild(played);

            editableFields.forEach(field => {
                row.appendChild(createStatCell(field));
            });

            row.appendChild(
                createCalculatedCell(
                    stats ? stats.goalDifference : null
                )
            );

            row.appendChild(
                createCalculatedCell(
                    stats ? stats.points : null
                )
            );

            elements.leagueTeams.appendChild(row);
        });


        updateDashboard();
    }


    // ==========================================
    // UPDATE DASHBOARD SUMMARY
    // ==========================================

    function updateDashboard() {

        const validTeams = teams
            .map(team => ({
                team,
                stats: getTeamStats(team)
            }))
            .filter(item => item.stats !== null);

        const totalGoals = validTeams.reduce(
            (sum, item) => sum + item.stats.gf,
            0
        );

        const totalAppearances = validTeams.reduce(
            (sum, item) => sum + item.stats.played,
            0
        );

        const sortedTeams = getSortedTeams();

        const leader = sortedTeams.find(team => getTeamStats(team));

        elements.totalTeams.textContent = teams.length;

        // Each completed match contributes two team appearances.
        elements.totalMatches.textContent =
            Number.isInteger(totalAppearances / 2)
                ? totalAppearances / 2
                : (totalAppearances / 2).toFixed(1);

        elements.totalGoals.textContent = totalGoals;

        elements.leagueLeader.textContent =
            leader ? leader.name : "—";

        const invalidTeams = teams.filter(team => {

            return (
                !getTeamStats(team) ||
                !isValidTeamName(team, teams)
            );
        });

        if (invalidTeams.length > 0) {

            setStatus(
                `${invalidTeams.length} team(s) have invalid or duplicate information. Please review highlighted entries.`,
                "error"
            );

        } else {

            setStatus(
                "All team statistics are valid. League standings are up to date.",
                "success"
            );
        }
    }


    // ==========================================
    // HANDLE TABLE INPUT
    // ==========================================

    function handleTableInput(event) {

        const input = event.target;

        if (!input.matches("[data-field]")) return;

        const row = input.closest("tr");

        if (!row) return;

        const teamId = row.dataset.teamId;

        const team = teams.find(item => item.id === teamId);

        if (!team) return;

        const field = input.dataset.field;

        if (!["name", "won", "drawn", "lost", "gf", "ga"].includes(field)) {
            return;
        }

        team[field] = input.value;

        if (field === "name") {

            const duplicate = !isValidTeamName(team, teams);

            input.classList.toggle("invalid-input", duplicate);

        } else {

            const value = getNumericValue(input.value);

            input.classList.toggle(
                "invalid-input",
                value === null
            );
        }


        // Update calculated cells without rebuilding the table.
        const stats = getTeamStats(team);

        row.classList.toggle("invalid-row", !stats);

        row.children[2].textContent =
            stats ? stats.played : "—";

        row.children[8].textContent =
            stats ? stats.goalDifference : "—";

        row.children[9].textContent =
            stats ? stats.points : "—";


        // Check duplicate team names.
        const duplicate = !isValidTeamName(team, teams);

        row.querySelector(".team-name").classList.toggle(
            "invalid-input",
            duplicate
        );


        updateDashboard();

        saveLeague();
    }


    // ==========================================
    // SORT WHEN INPUT CHANGES ARE COMMITTED
    // ==========================================

    function handleTableChange(event) {

        if (!event.target.matches("[data-field]")) return;

        renderLeague();

        saveLeague();
    }


    // ==========================================
    // RESET STATISTICS
    // ==========================================

    function resetStatistics() {

        if (teams.length === 0) {

            setStatus("There are no teams to reset.", "error");

            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to reset all statistics? Team names will be preserved."
        );

        if (!confirmed) return;


        teams = teams.map(team => ({
            ...team,
            won: "0",
            drawn: "0",
            lost: "0",
            gf: "0",
            ga: "0"
        }));


        saveLeague();

        renderLeague();

        setStatus(
            "All statistics have been reset. Team names were preserved.",
            "success"
        );
    }


    // ==========================================
    // EXPORT LEAGUE TO CSV
    // ==========================================

    function exportLeague() {

        if (teams.length === 0) {

            setStatus(
                "Generate a league before exporting.",
                "error"
            );

            return;
        }


        const invalidTeams = teams.filter(team => {

            return (
                !getTeamStats(team) ||
                !isValidTeamName(team, teams)
            );
        });

        if (invalidTeams.length > 0) {

            setStatus(
                "Correct invalid team information before exporting.",
                "error"
            );

            return;
        }


        const headers = [
            "Position",
            "Team",
            "Played",
            "Won",
            "Drawn",
            "Lost",
            "Goals For",
            "Goals Against",
            "Goal Difference",
            "Points"
        ];


        const rows = getSortedTeams().map((team, index) => {

            const stats = getTeamStats(team);

            return [
                index + 1,
                team.name,
                stats.played,
                stats.won,
                stats.drawn,
                stats.lost,
                stats.gf,
                stats.ga,
                stats.goalDifference,
                stats.points
            ];
        });


        const csvContent = [
            headers.map(escapeCSV).join(","),
            ...rows.map(row => row.map(escapeCSV).join(","))
        ].join("\r\n");


        const blob = new Blob(
            ["\uFEFF" + csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = "awarri-league-standings.csv";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);


        setStatus(
            "League standings exported successfully.",
            "success"
        );
    }


    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    elements.setupForm.addEventListener(
        "submit",
        generateLeague
    );


    elements.leagueTeams.addEventListener(
        "input",
        handleTableInput
    );


    elements.leagueTeams.addEventListener(
        "change",
        handleTableChange
    );


    elements.resetBtn.addEventListener(
        "click",
        resetStatistics
    );


    elements.exportBtn.addEventListener(
        "click",
        exportLeague
    );


    // ==========================================
    // INITIALIZE APPLICATION
    // ==========================================

    elements.currentYear.textContent =
        new Date().getFullYear();


    const hasSavedLeague = loadLeague();

    if (hasSavedLeague) {

        elements.numTeams.value = teams.length;

        renderLeague();

        setStatus(
            "Your saved league has been restored successfully.",
            "success"
        );

    } else {

        teams = Array.from(
            { length: 4 },
            (_, index) => createTeam(index)
        );

        elements.numTeams.value = 4;

        saveLeague();

        renderLeague();

        setStatus(
            "Welcome! Your four-team league is ready.",
            "success"
        );
    }

});
