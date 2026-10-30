"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const STORAGE_KEY = "awarri_team_assignment_v3";

    const MIN_TEAMS = 1;
    const MAX_TEAMS = 30;

    const MAX_PLAYER_NAME_LENGTH = 80;

    let teams = [];
    let players = [];

    // ==========================================
    // DOM ELEMENTS
    // ==========================================

    const elements = {
        setupForm: document.getElementById("setup-form"),
        numTeams: document.getElementById("numTeams"),

        singlePlayerForm: document.getElementById("single-player-form"),
        playerName: document.getElementById("playerName"),

        assignmentTeam: document.getElementById("assignmentTeam"),

        playerList: document.getElementById("playerList"),
        bulkAddButton: document.getElementById("bulk-add-btn"),

        teamsContainer: document.getElementById("teams"),

        status: document.getElementById("league-status"),

        totalPlayers: document.getElementById("total-players"),
        totalTeams: document.getElementById("total-teams"),
        averagePlayers: document.getElementById("average-players"),

        rosterSummary: document.getElementById("roster-summary"),

        randomizeButton: document.getElementById("randomize-btn"),
        copyButton: document.getElementById("copy-btn"),

        currentYear: document.getElementById("current-year")
    };

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    function createId() {

        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function showStatus(message, type = "success") {

        elements.status.textContent = message;

        elements.status.classList.toggle(
            "error",
            type === "error"
        );

        elements.status.hidden = false;
    }

    // ==========================================
    // LOCAL STORAGE
    // ==========================================

    function saveData() {

        try {

            const data = {
                version: 1,
                teams,
                players
            };

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );

        } catch (error) {

            console.error(
                "Unable to save team assignment data:",
                error
            );

            showStatus(
                "Your changes could not be saved. Check your browser storage settings.",
                "error"
            );
        }
    }

    function loadData() {

        try {

            const savedData = localStorage.getItem(STORAGE_KEY);

            if (!savedData) {
                return false;
            }

            const parsedData = JSON.parse(savedData);

            if (
                !parsedData ||
                parsedData.version !== 1 ||
                !Array.isArray(parsedData.teams) ||
                !Array.isArray(parsedData.players) ||
                parsedData.teams.length > MAX_TEAMS
            ) {
                return false;
            }

            // Validate teams.

            const validTeams = parsedData.teams.every((team) => {

                return (
                    team &&
                    typeof team.id === "string" &&
                    typeof team.name === "string" &&
                    team.name.trim().length > 0
                );

            });

            if (!validTeams) {
                return false;
            }

            const teamIds = new Set(
                parsedData.teams.map((team) => team.id)
            );

            if (teamIds.size !== parsedData.teams.length) {
                return false;
            }

            // Validate players.

            const validPlayers = parsedData.players.every((player) => {

                return (
                    player &&
                    typeof player.id === "string" &&
                    typeof player.name === "string" &&
                    player.name.trim().length > 0 &&
                    player.name.length <= MAX_PLAYER_NAME_LENGTH &&
                    typeof player.teamId === "string" &&
                    teamIds.has(player.teamId)
                );

            });

            if (!validPlayers) {
                return false;
            }

            const playerIds = new Set(
                parsedData.players.map((player) => player.id)
            );

            if (playerIds.size !== parsedData.players.length) {
                return false;
            }

            teams = parsedData.teams;
            players = parsedData.players;

            return true;

        } catch (error) {

            console.error(
                "Unable to load saved team data:",
                error
            );

            return false;
        }
    }

    // ==========================================
    // RANDOMIZATION
    // ==========================================

    function shuffleArray(items) {

        const shuffled = [...items];

        for (let i = shuffled.length - 1; i > 0; i--) {

            const randomIndex = Math.floor(
                Math.random() * (i + 1)
            );

            [shuffled[i], shuffled[randomIndex]] = [
                shuffled[randomIndex],
                shuffled[i]
            ];
        }

        return shuffled;
    }

    // ==========================================
    // TEAM ASSIGNMENT
    // ==========================================

    function getSmallestTeam() {

        if (teams.length === 0) {
            return null;
        }

        const teamCounts = teams.map((team) => {

            return {
                team,
                count: players.filter(
                    (player) => player.teamId === team.id
                ).length
            };

        });

        const smallestCount = Math.min(
            ...teamCounts.map((item) => item.count)
        );

        const smallestTeams = teamCounts.filter(
            (item) => item.count === smallestCount
        );

        // Randomly select between equally sized teams.

        const randomIndex = Math.floor(
            Math.random() * smallestTeams.length
        );

        return smallestTeams[randomIndex].team;
    }

    function getSelectedAssignmentTeam() {

        const selectedTeamId = elements.assignmentTeam.value;

        if (selectedTeamId === "auto") {
            return getSmallestTeam();
        }

        return teams.find(
            (team) => team.id === selectedTeamId
        ) || null;
    }

    // Populate the manual assignment dropdown.

    function populateAssignmentOptions() {

        const previousValue =
            elements.assignmentTeam.value || "auto";

        elements.assignmentTeam.replaceChildren();

        const autoOption = document.createElement("option");

        autoOption.value = "auto";
        autoOption.textContent = "Automatically balance teams";

        elements.assignmentTeam.appendChild(autoOption);

        teams.forEach((team) => {

            const option = document.createElement("option");

            option.value = team.id;
            option.textContent = team.name;

            elements.assignmentTeam.appendChild(option);

        });

        const previousOptionExists = Array.from(
            elements.assignmentTeam.options
        ).some((option) => option.value === previousValue);

        elements.assignmentTeam.value = previousOptionExists
            ? previousValue
            : "auto";
    }

    // Automatically distribute all players.

    function distributePlayers() {

        if (teams.length === 0) {
            return;
        }

        const shuffledPlayers = shuffleArray(players);

        shuffledPlayers.forEach((player, index) => {

            const team = teams[index % teams.length];

            player.teamId = team.id;

        });

        saveData();
        render();
    }

    // ==========================================
    // CREATE TEAMS
    // ==========================================

    function setupTeams(event) {

        if (event) {
            event.preventDefault();
        }

        const numberOfTeams = Number(
            elements.numTeams.value
        );

        if (
            !Number.isInteger(numberOfTeams) ||
            numberOfTeams < MIN_TEAMS ||
            numberOfTeams > MAX_TEAMS
        ) {

            showStatus(
                `Enter a valid number of teams between ${MIN_TEAMS} and ${MAX_TEAMS}.`,
                "error"
            );

            elements.numTeams.focus();

            return;
        }

        if (
            teams.length > 0 &&
            !window.confirm(
                "Changing the team setup will redistribute all existing players. Continue?"
            )
        ) {
            return;
        }

        teams = Array.from(
            { length: numberOfTeams },
            (_, index) => {

                return {
                    id: createId(),
                    name: `Team ${index + 1}`
                };

            }
        );

        // Reassign existing players if teams already exist.

        if (players.length > 0) {

            distributePlayers();

        } else {

            saveData();
            render();

        }

        showStatus(
            `${numberOfTeams} team${numberOfTeams === 1 ? "" : "s"} created successfully.`
        );
    }

    // ==========================================
    // ADD ONE PLAYER
    // ==========================================

    function addPlayer(event) {

        if (event) {
            event.preventDefault();
        }

        if (teams.length === 0) {

            showStatus(
                "Please create your teams before adding players.",
                "error"
            );

            elements.numTeams.focus();

            return;
        }

        const name = elements.playerName.value.trim();

        if (!name) {

            showStatus(
                "Please enter the player's name.",
                "error"
            );

            elements.playerName.focus();

            return;
        }

        if (name.length > MAX_PLAYER_NAME_LENGTH) {

            showStatus(
                `Player names cannot exceed ${MAX_PLAYER_NAME_LENGTH} characters.`,
                "error"
            );

            return;
        }

        const selectedTeam = getSelectedAssignmentTeam();

        if (!selectedTeam) {

            showStatus(
                "Please select a valid team.",
                "error"
            );

            return;
        }

        players.push({

            id: createId(),

            name,

            teamId: selectedTeam.id

        });

        elements.playerName.value = "";

        saveData();
        render();

        showStatus(
            `${name} has been added to ${selectedTeam.name}.`
        );

        elements.playerName.focus();
    }

    // ==========================================
    // ADD MULTIPLE PLAYERS
    // ==========================================

    function addMultiplePlayers() {

        if (teams.length === 0) {

            showStatus(
                "Please create your teams before adding players.",
                "error"
            );

            return;
        }

        const rawNames = elements.playerList.value.trim();

        if (!rawNames) {

            showStatus(
                "Paste at least one player name.",
                "error"
            );

            elements.playerList.focus();

            return;
        }

        // Split by line breaks, commas or semicolons.

        const names = rawNames
            .split(/[\n,;]+/)
            .map((name) => name.trim())
            .filter(Boolean);

        if (names.length === 0) {

            showStatus(
                "No valid player names were found.",
                "error"
            );

            return;
        }

        const validNames = names.filter(
            (name) => name.length <= MAX_PLAYER_NAME_LENGTH
        );

        const rejectedCount = names.length - validNames.length;

        if (validNames.length === 0) {

            showStatus(
                `Each player name must be ${MAX_PLAYER_NAME_LENGTH} characters or fewer.`,
                "error"
            );

            return;
        }

        const selectedTeamId = elements.assignmentTeam.value;

        const selectedTeam = selectedTeamId === "auto"
            ? null
            : teams.find(
                (team) => team.id === selectedTeamId
            );

        if (
            selectedTeamId !== "auto" &&
            !selectedTeam
        ) {

            showStatus(
                "Please select a valid team.",
                "error"
            );

            return;
        }

        validNames.forEach((name) => {

            // Manual assignment uses the selected team.
            // Automatic assignment uses the smallest team.

            const targetTeam = selectedTeam || getSmallestTeam();

            if (!targetTeam) {
                return;
            }

            players.push({

                id: createId(),

                name,

                teamId: targetTeam.id

            });

        });

        elements.playerList.value = "";

        saveData();
        render();

        let message;

        if (selectedTeam) {

            message =
                `${validNames.length} player${validNames.length === 1 ? "" : "s"} added to ${selectedTeam.name}.`;

        } else {

            message =
                `${validNames.length} player${validNames.length === 1 ? "" : "s"} added and distributed automatically.`;

        }

        if (rejectedCount > 0) {

            message +=
                ` ${rejectedCount} name${rejectedCount === 1 ? "" : "s"} skipped because they exceeded the character limit.`;

        }

        showStatus(message);
    }

    // ==========================================
    // REMOVE PLAYER
    // ==========================================

    function removePlayer(playerId) {

        const player = players.find(
            (item) => item.id === playerId
        );

        if (!player) {
            return;
        }

        const shouldRemove = window.confirm(
            `Remove ${player.name} from the team assignment?`
        );

        if (!shouldRemove) {
            return;
        }

        players = players.filter(
            (item) => item.id !== playerId
        );

        saveData();
        render();

        showStatus(
            `${player.name} has been removed.`
        );
    }

    // ==========================================
    // MOVE PLAYER BETWEEN TEAMS
    // ==========================================

    function handleTeamChange(event) {

        const select = event.target.closest(
            ".player-team-select"
        );

        if (!select) {
            return;
        }

        const player = players.find(
            (item) => item.id === select.dataset.playerId
        );

        const newTeam = teams.find(
            (team) => team.id === select.value
        );

        if (!player || !newTeam) {
            return;
        }

        player.teamId = newTeam.id;

        saveData();
        render();

        showStatus(
            `${player.name} has been moved to ${newTeam.name}.`
        );
    }

    // ==========================================
    // RANDOMIZE PLAYERS
    // ==========================================

    function randomizePlayers() {

        if (teams.length === 0) {

            showStatus(
                "Create your teams first.",
                "error"
            );

            return;
        }

        if (players.length === 0) {

            showStatus(
                "Add players before randomizing teams.",
                "error"
            );

            return;
        }

        const shouldRandomize = window.confirm(
            "This will reshuffle all players across the teams. Continue?"
        );

        if (!shouldRandomize) {
            return;
        }

        distributePlayers();

        showStatus(
            "Players have been successfully randomized."
        );
    }

    // ==========================================
    // RENDER TEAM CARDS
    // ==========================================

    function renderTeams() {

        elements.teamsContainer.replaceChildren();

        if (teams.length === 0) {

            const emptyState = document.createElement("div");

            emptyState.className = "empty-state";

            const icon = document.createElement("div");

            icon.className = "empty-icon";
            icon.textContent = "⚽";

            const heading = document.createElement("h3");

            heading.textContent =
                "Your teams will appear here";

            const description = document.createElement("p");

            description.textContent =
                "Choose the number of teams, then start adding players to your roster.";

            emptyState.append(
                icon,
                heading,
                description
            );

            elements.teamsContainer.appendChild(
                emptyState
            );

            return;
        }

        teams.forEach((team) => {

            const teamPlayers = players.filter(
                (player) => player.teamId === team.id
            );

            // Team card.

            const card = document.createElement("article");

            card.className = "team";

            // Header.

            const header = document.createElement("div");

            header.className = "team-header";

            const title = document.createElement("h3");

            title.className = "team-title";
            title.textContent = team.name;

            const count = document.createElement("span");

            count.className = "team-count";

            count.textContent =
                `${teamPlayers.length} ${teamPlayers.length === 1 ? "Player" : "Players"}`;

            header.append(title, count);

            // Player list.

            const list = document.createElement("ul");

            list.className = "team-list";

            if (teamPlayers.length === 0) {

                const emptyMessage = document.createElement("li");

                emptyMessage.className = "empty-team";

                emptyMessage.textContent =
                    "No players assigned yet.";

                list.appendChild(emptyMessage);

            } else {

                teamPlayers.forEach((player) => {

                    const item = document.createElement("li");

                    item.className = "team-player";

                    // Player name.

                    const name = document.createElement("span");

                    name.className = "player-name";
                    name.textContent = player.name;

                    // Player team selector.

                    const teamSelect = document.createElement("select");

                    teamSelect.className = "player-team-select";

                    teamSelect.dataset.playerId = player.id;

                    teamSelect.setAttribute(
                        "aria-label",
                        `Change team for ${player.name}`
                    );

                    teams.forEach((availableTeam) => {

                        const option = document.createElement("option");

                        option.value = availableTeam.id;

                        option.textContent = availableTeam.name;

                        option.selected =
                            availableTeam.id === player.teamId;

                        teamSelect.appendChild(option);

                    });

                    // Remove button.

                    const removeButton = document.createElement("button");

                    removeButton.type = "button";

                    removeButton.className = "remove-player";

                    removeButton.textContent = "×";

                    removeButton.setAttribute(
                        "aria-label",
                        `Remove ${player.name}`
                    );

                    removeButton.dataset.playerId = player.id;

                    removeButton.title = "Remove player";

                    item.append(
                        name,
                        teamSelect,
                        removeButton
                    );

                    list.appendChild(item);

                });

            }

            card.append(header, list);

            elements.teamsContainer.appendChild(card);

        });
    }

    // ==========================================
    // UPDATE DASHBOARD
    // ==========================================

    function updateDashboard() {

        const totalPlayers = players.length;

        const totalTeams = teams.length;

        const averagePlayers = totalTeams > 0
            ? (totalPlayers / totalTeams).toFixed(1)
            : "0";

        elements.totalPlayers.textContent = totalPlayers;

        elements.totalTeams.textContent = totalTeams;

        elements.averagePlayers.textContent = averagePlayers;

        elements.rosterSummary.textContent = totalTeams > 0

            ? `${totalTeams} ${totalTeams === 1 ? "Team" : "Teams"} · ${totalPlayers} ${totalPlayers === 1 ? "Player" : "Players"}`

            : "No teams created";

        elements.randomizeButton.disabled =
            totalTeams === 0 || totalPlayers === 0;

        elements.copyButton.disabled =
            totalTeams === 0 || totalPlayers === 0;
    }

    // ==========================================
    // RENDER APPLICATION
    // ==========================================

    function render() {

        populateAssignmentOptions();

        renderTeams();

        updateDashboard();
    }

    // ==========================================
    // COPY TEAM ASSIGNMENTS
    // ==========================================

    function buildTeamText() {

        const lines = [

            "AWARRI FOOTBALL LEAGUE",

            "TEAM ASSIGNMENT",

            "========================"

        ];

        teams.forEach((team) => {

            const teamPlayers = players.filter(
                (player) => player.teamId === team.id
            );

            lines.push("");

            lines.push(
                `${team.name} (${teamPlayers.length} ${teamPlayers.length === 1 ? "Player" : "Players"})`
            );

            lines.push("------------------------");

            if (teamPlayers.length === 0) {

                lines.push("No players assigned");

            } else {

                teamPlayers.forEach((player, index) => {

                    lines.push(
                        `${index + 1}. ${player.name}`
                    );

                });

            }

        });

        return lines.join("\n");
    }

    async function copyTeams() {

        if (teams.length === 0 || players.length === 0) {

            showStatus(
                "There are no team assignments to copy.",
                "error"
            );

            return;
        }

        const text = buildTeamText();

        try {

            if (
                navigator.clipboard &&
                typeof navigator.clipboard.writeText === "function"
            ) {

                await navigator.clipboard.writeText(text);

            } else {

                const temporaryInput =
                    document.createElement("textarea");

                temporaryInput.value = text;

                temporaryInput.style.position = "fixed";

                temporaryInput.style.opacity = "0";

                document.body.appendChild(temporaryInput);

                temporaryInput.select();

                const copied = document.execCommand("copy");

                temporaryInput.remove();

                if (!copied) {
                    throw new Error("Clipboard copy failed.");
                }

            }

            showStatus(
                "Team assignments copied to your clipboard."
            );

        } catch (error) {

            console.error(
                "Unable to copy team assignments:",
                error
            );

            showStatus(
                "Unable to copy automatically. Try opening the page in a secure browser context.",
                "error"
            );
        }
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    elements.setupForm.addEventListener(
        "submit",
        setupTeams
    );

    elements.singlePlayerForm.addEventListener(
        "submit",
        addPlayer
    );

    elements.bulkAddButton.addEventListener(
        "click",
        addMultiplePlayers
    );

    elements.randomizeButton.addEventListener(
        "click",
        randomizePlayers
    );

    elements.copyButton.addEventListener(
        "click",
        copyTeams
    );

    // Handle player removal.

    elements.teamsContainer.addEventListener(
        "click",
        (event) => {

            const button = event.target.closest(
                ".remove-player"
            );

            if (!button) {
                return;
            }

            removePlayer(button.dataset.playerId);

        }
    );

    // Handle moving players between teams.

    elements.teamsContainer.addEventListener(
        "change",
        handleTeamChange
    );

    // ==========================================
    // INITIALIZE APPLICATION
    // ==========================================

    elements.currentYear.textContent =
        new Date().getFullYear();

    const hasSavedData = loadData();

    if (hasSavedData) {

        elements.numTeams.value = teams.length;

        render();

        if (teams.length > 0) {

            showStatus(
                "Your previous team assignments have been restored."
            );

        }

    } else {

        teams = [];

        players = [];

        render();

    }

});