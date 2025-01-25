let sectionForDatabaseModels = document.getElementById('sectionForDatabaseModels');

sectionForDatabaseModels.innerHTML = 
`<div class="model row">
    <div class="col model-1"></div>
    <div class="col model-2"></div>
    <div class="col model-3"></div>
    <div class="col model-4"></div>
    <div class="col model-5"></div>
    <div class="col model-6"></div>
</div>`;

document.addEventListener('DOMContentLoaded', function() {
    async function allModel() {
        try {
            let response = await fetch(`/getModel${statusProgram.brand}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let result = await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }
    allModel()
})
