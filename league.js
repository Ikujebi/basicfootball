
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const STORAGE_KEY = "awarri_football_league_v2";

    const MIN_TEAMS = 2;
    const MAX_TEAMS = 30;

    const STAT_FIELDS = {
        won: {
            label: "Matches Won",
            short: "W"
        },
        drawn: {
            label: "Matches Drawn",
            short: "D"
        },
        lost: {
            label: "Matches Lost",
            short: "L"
        },
        gf: {
            label: "Goals For",
            short: "GF"
        },
        ga: {
            label: "Goals Against",
            short: "GA"
        }
    };


    // ==========================================
    // DOM ELEMENTS
    // ==========================================

    const elements = {
        setupForm: document.getElementById("setup-form"),
        numTeams: document.getElementById("numTeams"),

        updateForm: document.getElementById("update-form"),
        updateTeam: document.getElementById("update-team"),
        updateField: document.getElementById("update-field"),
        updateAction: document.getElementById("update-action"),
        updateAmount: document.getElementById("update-amount"),
        updatePreview: document.getElementById("update-preview"),
        previewText: document.getElementById("preview-text"),

        leagueTeams: document.getElementById("league-teams"),
        leagueStatus: document.getElementById("league-status"),

        totalTeams: document.getElementById("total-teams"),
        totalMatches: document.getElementById("total-matches"),
        totalGoals: document.getElementById("total-goals"),
        leagueLeader: document.getElementById("league-leader"),
        standingsCount: document.getElementById("standings-count"),

        exportBtn: document.getElementById("export-btn"),
        resetBtn: document.getElementById("reset-btn"),
        currentYear: document.getElementById("current-year")
    };


    // ==========================================
    // VALIDATE REQUIRED ELEMENTS
    // ==========================================

    for (const [name, element] of Object.entries(elements)) {

        if (!element) {
            console.error(`Required HTML element missing: ${name}`);
            return;
        }
    }


    // ==========================================
    // APPLICATION STATE
    // ==========================================

    let teams = [];


    // ==========================================
    // GENERAL HELPERS
    // ==========================================

    function createTeam(index) {

        return {
            id: `team-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
            name: `Team ${index + 1}`,

            won: "0",
            drawn: "0",
            lost: "0",
            gf: "0",
            ga: "0"
        };
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


    function formatNumber(value) {

        return Number(value).toLocaleString("en-NG");
    }


    function escapeCSV(value) {

        return `"${String(value ?? "").replace(/"/g, '""')}"`;
    }


    function getTeamById(teamId) {

        return teams.find(team => team.id === teamId) || null;
    }


    // ==========================================
    // TEAM STATISTICS
    // ==========================================

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


    function isValidTeamName(team, allTeams = teams) {

        const name = team.name.trim().toLowerCase();

        if (!name) {
            return false;
        }

        return allTeams.every(otherTeam => {

            if (otherTeam.id === team.id) {
                return true;
            }

            return otherTeam.name.trim().toLowerCase() !== name;
        });
    }


    function isValidTeam(team) {

        return (
            getTeamStats(team) !== null &&
            isValidTeamName(team)
        );
    }


    function getSortedTeams() {

        return [...teams].sort((a, b) => {

            const statsA = getTeamStats(a);
            const statsB = getTeamStats(b);

            if (statsA && !statsB) return -1;
            if (!statsA && statsB) return 1;

            if (!statsA || !statsB) {
                return a.name.localeCompare(b.name);
            }

            // 1. Points.

            if (statsA.points !== statsB.points) {
                return statsB.points - statsA.points;
            }

            // 2. Goal difference.

            if (statsA.goalDifference !== statsB.goalDifference) {
                return statsB.goalDifference - statsA.goalDifference;
            }

            // 3. Goals scored.

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

            return true;

        } catch (error) {

            console.error("Unable to save league:", error);

            setStatus(
                "Unable to save your changes. Check your browser storage settings.",
                "error"
            );

            return false;
        }
    }


    function loadLeague() {

        try {

            const savedData = localStorage.getItem(STORAGE_KEY);

            if (!savedData) {
                return false;
            }

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

            if (!validData) {
                return false;
            }

            const uniqueIds = new Set(
                parsedData.map(team => team.id)
            );

            if (uniqueIds.size !== parsedData.length) {
                return false;
            }

            teams = parsedData;

            return true;

        } catch (error) {

            console.error("Unable to restore league:", error);

            return false;
        }
    }


    // ==========================================
    // STATUS MESSAGES
    // ==========================================

    function setStatus(message, type = "info") {

        elements.leagueStatus.textContent = message;

        elements.leagueStatus.className =
            `status-message status-${type}`;
    }


    // ==========================================
    // TEAM DROPDOWN
    // ==========================================

    function updateTeamDropdown() {

        const previousSelection = elements.updateTeam.value;

        const fragment = document.createDocumentFragment();

        const defaultOption = document.createElement("option");

        defaultOption.value = "";
        defaultOption.textContent = "Select a team";

        fragment.appendChild(defaultOption);

        getSortedTeams().forEach(team => {

            const option = document.createElement("option");

            option.value = team.id;
            option.textContent = team.name;

            fragment.appendChild(option);
        });

        elements.updateTeam.replaceChildren(fragment);

        const selectionStillExists = teams.some(team => {
            return team.id === previousSelection;
        });

        if (selectionStillExists) {
            elements.updateTeam.value = previousSelection;
        }

        updatePreview();
    }


    // ==========================================
    // UPDATE PREVIEW
    // ==========================================

    function updatePreview() {

        const team = getTeamById(elements.updateTeam.value);

        const field = elements.updateField.value;

        const action = elements.updateAction.value;

        const amount = getNumericValue(elements.updateAmount.value);

        if (!team) {

            elements.previewText.textContent =
                "Select a team and enter an amount.";

            elements.updatePreview.classList.remove("preview-valid");

            return;
        }

        if (!STAT_FIELDS[field]) {

            elements.previewText.textContent =
                "Select a valid statistic.";

            return;
        }

        if (amount === null) {

            elements.previewText.textContent =
                `Current ${STAT_FIELDS[field].label}: ${formatNumber(team[field])}`;

            elements.updatePreview.classList.remove("preview-valid");

            return;
        }

        const currentValue = getNumericValue(team[field]);

        if (currentValue === null) {

            elements.previewText.textContent =
                "The selected team's current statistic is invalid.";

            return;
        }

        let newValue;

        if (action === "increase") {

            newValue = currentValue + amount;

        } else if (action === "decrease") {

            newValue = currentValue - amount;

        } else {

            newValue = amount;
        }

        if (
            !Number.isSafeInteger(newValue) ||
            newValue < 0
        ) {

            elements.previewText.textContent =
                "This update would produce an invalid negative value.";

            elements.updatePreview.classList.remove("preview-valid");

            return;
        }

        const actionLabels = {
            increase: "Increase",
            decrease: "Reduce",
            set: "Set"
        };

        const preview = `${actionLabels[action]} ${team.name}'s ${STAT_FIELDS[field].label} from ${formatNumber(currentValue)} to ${formatNumber(newValue)}.`;

        elements.previewText.textContent = preview;

        elements.updatePreview.classList.add("preview-valid");
    }


    // ==========================================
    // APPLY STATISTICS UPDATE
    // ==========================================

    function applyStatisticsUpdate(event) {

        event.preventDefault();

        const team = getTeamById(elements.updateTeam.value);

        const field = elements.updateField.value;

        const action = elements.updateAction.value;

        const amount = getNumericValue(elements.updateAmount.value);

        if (!team) {

            setStatus(
                "Please select a team before applying an update.",
                "error"
            );

            return;
        }

        if (!STAT_FIELDS[field]) {

            setStatus(
                "Please select a valid statistic.",
                "error"
            );

            return;
        }

        if (amount === null) {

            setStatus(
                "Please enter a valid non-negative whole number.",
                "error"
            );

            elements.updateAmount.focus();

            return;
        }

        const currentValue = getNumericValue(team[field]);

        if (currentValue === null) {

            setStatus(
                "The current statistic is invalid. Please review the team data.",
                "error"
            );

            return;
        }

        let newValue;

        if (action === "increase") {

            newValue = currentValue + amount;

        } else if (action === "decrease") {

            newValue = currentValue - amount;

        } else if (action === "set") {

            newValue = amount;

        } else {

            setStatus(
                "Invalid update action selected.",
                "error"
            );

            return;
        }

        if (
            !Number.isSafeInteger(newValue) ||
            newValue < 0
        ) {

            setStatus(
                "This update is not allowed. Statistics cannot be negative.",
                "error"
            );

            return;
        }

        if (newValue === currentValue) {

            setStatus(
                "No changes were made because the new value is the same as the current value.",
                "info"
            );

            return;
        }

        const actionLabels = {
            increase: "increase",
            decrease: "reduce",
            set: "set"
        };

        const confirmation = window.confirm(
            `Confirm update?\n\nTeam: ${team.name}\nStatistic: ${STAT_FIELDS[field].label}\nCurrent value: ${currentValue}\nAction: ${actionLabels[action]}\nNew value: ${newValue}\n\nDo you want to continue?`
        );

        if (!confirmation) {
            return;
        }

        const previousValue = team[field];

        team[field] = String(newValue);

        if (!saveLeague()) {

            team[field] = previousValue;

            renderLeague();

            updateTeamDropdown();

            updatePreview();

            return;
        }

        renderLeague();

        updateTeamDropdown();

        elements.updateAmount.value = "";

        updatePreview();

        setStatus(
            `${team.name}'s ${STAT_FIELDS[field].label} successfully updated from ${currentValue} to ${newValue}.`,
            "success"
        );
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
                `Please enter a number between ${MIN_TEAMS} and ${MAX_TEAMS}.`,
                "error"
            );

            return;
        }

        if (teams.length > 0) {

            const confirmed = window.confirm(
                "Generating a new league will replace your existing teams and statistics. Continue?"
            );

            if (!confirmed) {
                return;
            }
        }

        const previousTeams = teams;

        teams = Array.from(
            { length: numberOfTeams },
            (_, index) => createTeam(index)
        );

        if (!saveLeague()) {

            teams = previousTeams;

            renderLeague();

            updateTeamDropdown();

            return;
        }

        renderLeague();

        updateTeamDropdown();

        setStatus(
            `${numberOfTeams} teams have been successfully added to your league.`,
            "success"
        );
    }


    // ==========================================
    // TABLE CELL HELPERS
    // ==========================================

    function createTextCell(value, className = "") {

        const cell = document.createElement("td");

        if (className) {
            cell.className = className;
        }

        cell.textContent = value;

        return cell;
    }


    function createPositionCell(position, isLeader) {

        const cell = document.createElement("td");

        const badge = document.createElement("span");

        badge.className = "position-badge";

        badge.textContent = position;

        if (isLeader) {
            badge.classList.add("first-position");
        }

        cell.appendChild(badge);

        return cell;
    }


    function createTeamCell(team) {

        const cell = document.createElement("td");

        cell.className = "team-column";

        const name = document.createElement("span");

        name.className = "team-name-display";

        name.textContent = team.name;

        cell.appendChild(name);

        return cell;
    }


    // ==========================================
    // RENDER LEAGUE
    // ==========================================

    function renderLeague() {

        const fragment = document.createDocumentFragment();

        const sortedTeams = getSortedTeams();

        if (sortedTeams.length === 0) {

            const row = document.createElement("tr");

            const cell = document.createElement("td");

            cell.colSpan = 10;

            cell.className = "empty-state";

            cell.textContent =
                "No teams available. Generate a league to get started.";

            row.appendChild(cell);

            fragment.appendChild(row);

            elements.leagueTeams.replaceChildren(fragment);

            updateDashboard();

            return;
        }

        sortedTeams.forEach((team, index) => {

            const stats = getTeamStats(team);

            const isLeader =
                index === 0 &&
                stats !== null &&
                isValidTeam(team);

            const row = document.createElement("tr");

            if (isLeader) {
                row.classList.add("leader-row");
            }

            if (!isValidTeam(team)) {
                row.classList.add("invalid-row");
            }

            // Position.

            row.appendChild(
                createPositionCell(
                    index + 1,
                    isLeader
                )
            );

            // Team name.

            row.appendChild(
                createTeamCell(team)
            );

            // Played.

            row.appendChild(
                createTextCell(
                    stats ? formatNumber(stats.played) : "—",
                    "calculated-cell"
                )
            );

            // Won.

            row.appendChild(
                createTextCell(
                    stats ? formatNumber(stats.won) : "—",
                    "calculated-cell"
                )
            );

            // Drawn.

            row.appendChild(
                createTextCell(
                    stats ? formatNumber(stats.drawn) : "—",
                    "calculated-cell"
                )
            );

            // Lost.

            row.appendChild(
                createTextCell(
                    stats ? formatNumber(stats.lost) : "—",
                    "calculated-cell"
                )
            );

            // Goals For.

            row.appendChild(
                createTextCell(
                    stats ? formatNumber(stats.gf) : "—",
                    "calculated-cell"
                )
            );

            // Goals Against.

            row.appendChild(
                createTextCell(
                    stats ? formatNumber(stats.ga) : "—",
                    "calculated-cell"
                )
            );

            // Goal Difference.

            row.appendChild(
                createTextCell(
                    stats ? formatNumber(stats.goalDifference) : "—",
                    "calculated-cell"
                )
            );

            // Points.

            row.appendChild(
                createTextCell(
                    stats ? formatNumber(stats.points) : "—",
                    "calculated-cell"
                )
            );

            fragment.appendChild(row);
        });

        elements.leagueTeams.replaceChildren(fragment);

        updateDashboard();
    }


    // ==========================================
    // DASHBOARD SUMMARY
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

        const leader = sortedTeams.find(team => {
            return isValidTeam(team);
        });

        const invalidTeams = teams.filter(team => {
            return !isValidTeam(team);
        });

        elements.totalTeams.textContent =
            formatNumber(teams.length);

        // This is an estimate from team appearances.
        // It is not a verified match count unless all team
        // statistics have been recorded consistently.

        const estimatedMatches = totalAppearances / 2;

        elements.totalMatches.textContent =
            Number.isInteger(estimatedMatches)
                ? formatNumber(estimatedMatches)
                : estimatedMatches.toFixed(1);

        elements.totalGoals.textContent =
            formatNumber(totalGoals);

        elements.leagueLeader.textContent =
            leader ? leader.name : "—";

        elements.standingsCount.textContent =
            `${teams.length} ${teams.length === 1 ? "TEAM" : "TEAMS"}`;

        if (invalidTeams.length > 0) {

            setStatus(
                `${invalidTeams.length} team(s) contain invalid or duplicate information. Review the affected entries.`,
                "error"
            );
        }
    }


    // ==========================================
    // RESET STATISTICS
    // ==========================================

    function resetStatistics() {

        if (teams.length === 0) {

            setStatus(
                "There are no teams to reset.",
                "error"
            );

            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to reset all team statistics?\n\nTeam names will be preserved, but all wins, draws, losses and goals will return to zero."
        );

        if (!confirmed) {
            return;
        }

        const previousTeams = teams;

        teams = teams.map(team => ({
            ...team,
            won: "0",
            drawn: "0",
            lost: "0",
            gf: "0",
            ga: "0"
        }));

        if (!saveLeague()) {

            teams = previousTeams;

            renderLeague();

            updateTeamDropdown();

            return;
        }

        renderLeague();

        updateTeamDropdown();

        elements.updateAmount.value = "";

        updatePreview();

        setStatus(
            "All team statistics have been reset successfully. Team names were preserved.",
            "success"
        );
    }


    // ==========================================
    // CSV EXPORT
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
            return !isValidTeam(team);
        });

        if (invalidTeams.length > 0) {

            setStatus(
                "Please correct invalid team information before exporting.",
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

            ...rows.map(row => {
                return row.map(escapeCSV).join(",");
            })

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

        window.setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

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

    elements.updateForm.addEventListener(
        "submit",
        applyStatisticsUpdate
    );

    elements.updateTeam.addEventListener(
        "change",
        updatePreview
    );

    elements.updateField.addEventListener(
        "change",
        updatePreview
    );

    elements.updateAction.addEventListener(
        "change",
        updatePreview
    );

    elements.updateAmount.addEventListener(
        "input",
        updatePreview
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

        updateTeamDropdown();

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

        updateTeamDropdown();

        setStatus(
            "Welcome! Your four-team league is ready.",
            "success"
        );
    }

});
