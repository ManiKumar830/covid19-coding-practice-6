const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server is Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
  }
};

initializeDbAndServer();

//Returns a list of all states in the state table
//API 1

const getAllStateDetails = (stateObject) => {
  return {
    stateId: stateObject.state_id,
    stateName: stateObject.state_name,
    population: stateObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const statesDetailsQuery = `
    SELECT 
    *
    FROM 
    state;`;

  const stateDetailsResponse = await database.all(statesDetailsQuery);
  response.send(
    stateDetailsResponse.map((eachState) => getAllStateDetails(eachState))
  );
});

//Returns a state based on the state ID
//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const stateDetailsQuery = `
    SELECT 
    state_id as stateId,
    state_name as stateName,
    population as population
    FROM
    state
    WHERE state_id = '${stateId}';`;

  const stateDetailsResponse = await database.get(stateDetailsQuery);
  response.send(stateDetailsResponse);
});

//Create a district in the district table, district_id is auto-incremented
//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const districtDetailsQuery = `
    INSERT INTO 
    district (district_name, state_id, cases, cured, active, deaths)
    VALUES
     ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;

  await database.run(districtDetailsQuery);
  response.send("District Successfully Added");
});

//Returns a district based on the district ID
//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const districtQuery = `
    SELECT 
    district_id as districtId,
    district_name as districtName,
    state_id as stateId,
    cases as cases,
    cured as cured,
    active as active,
    deaths as deaths
    FROM 
    district
    WHERE district_id = ${districtId};`;

  const districtResponse = await database.get(districtQuery);
  response.send(districtResponse);
});

//Deletes a district from the district table based on the district ID
//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
    DELETE FROM 
    district
    WHERE district_id = ${districtId};`;

  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Updates the details of a specific district based on the district ID
//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistrictDetails = `
    UPDATE 
    district
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths};`;

  await database.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const sumQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM 
    district
    WHERE state_id = ${stateId};`;

  const stats = await database.get(sumQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//Returns an object containing the state name of a district based on the district ID
//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const stateQuery = `
    SELECT 
    state_id
    FROM 
    district
    WHERE 
    district_id = ${districtId};`;

  const stateResponse = await database.get(stateQuery);

  const stateNameQuery = `
  SELECT 
  state_name as stateName
  FROM 
  state
  WHERE state_id = ${stateResponse.state_id}`;

  const stateNameResponse = await database.get(stateNameQuery);
  response.send(stateNameResponse);
});

module.exports = app;
