## Display OMDb results
The task here today will be to create a very simple ui to search for and render back a list of movies from the OMDB api, utilizing the fetch api, and without using inline html event handlers. We'll want to have all of the results aggregated (iterate over each paginated result set and merge into a single collection), have them sorted by release year, then title, and then have a poster thumb with year and title rendered for each result. We'll then want some kind of singular view for movie details (the endpoint provides separate information) for each result. This should be done without incorporating any frameworks or external libraries (you may use a different style reset/normalizer if you prefer, though one has already been included)
