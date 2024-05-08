const calculateBtn = document.getElementById('calculate-btn');
if (calculateBtn) {
    calculateBtn.addEventListener('click', function () {
        console.log("Button  found!");
        calculateGDAndPoints();
    });
} else {
    console.error("Button not found!");
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
