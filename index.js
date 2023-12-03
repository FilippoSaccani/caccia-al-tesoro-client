const axios = require("axios");

const baseURL = "http://localhost:8080/";
const team = "fg";
const password = "ball";
let map, maxX, maxY, freeCells, min_time;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const signup = async() => {
    let response;
    try {
        response = await axios.get(`${baseURL}signup?team=${team}&password=${password}`);
    } catch (error) {
        if (error.response.data.code !== "TEAM_TAKEN") {
            console.log(error);
        }
    }
    min_time = response.data.time;
}

const getMap = async () => {
    try {
        map = (await axios.get(`${baseURL}map`)).data;
    } catch (error) {
        console.log("Mappa non trovata");
    }
}

const getFreeCells = () => {
    let count;
    freeCells = [];
    for (let y in map) {
        for (let x in map[y]) {
            if (!map[y][x].dug) {
                freeCells.push([x, y, false]);
            }
        }
    }

    //reinserisce ogni casella vuota nella tabella tante volte quante caselle vuote nel raggio di VERY CLOSE
    //in questo modo nell'estrazione sono favorite le caselle con più vicine libere
    for (let f in freeCells) {
        if (!freeCells[2]) {
            freeCells[f][2] = true;
            count = 0;

            for (let i = freeCells[f].y - 2; i <= freeCells[f].y + 2; i++) {
                for (let j = freeCells[f].x - 2; j <= freeCells[f].x + 2; j++) {
                    if (i >= 0 && i <= maxY && j >= 0 && j <= maxX) {
                        if (!map[i][j].dug) count++;
                    }
                }
            }

            for (let i in count) {
                freeCells.push(freeCells[f]);
            }
        }
    }
}

const dig = async (x, y) => {
    if (!map[y][x].dug && y >= 0 && y <= maxY && x >= 0 && x <= maxX) {
        await sleep(min_time);
        let message = (await axios.get(`${baseURL}dig?team=${team}&password=${password}&x=${x}&y=${y}`)).data.code;
        console.log("SCAVATO (" + x + ", " + y + ")");
        return message;
    }
    return null;
}

const lookVeryClose = async (x, y) => {
    let message;
    for (let i = y - 2; i <= y + 2; i++) {
        for (let j = x - 2; j <= x + 2; j++) {
            if (i >= 0 && i <= maxY && j >= 0 && j <= maxX) {
                await getMap();

                message = await dig(j, i);
                
                if (message === "TREASURE_FOUND") {
                    console.log("TROVATO");
                    return true;
                }
            }
        }
    }
    return false;
}

const lookForTreasure = async () => {
    let message;

    while (freeCells.length > 0) {
        let xy = freeCells[Math.floor(Math.random()*freeCells.length)];
        let x = parseInt(xy[0]);
        let y = parseInt(xy[1]);

        await getMap();

        message = await dig(x, y);

        if (message === "TREASURE_FOUND") {
            console.log("TROVATO");
        }
        else if (message === "VERY_CLOSE") {
            console.log("MOLTO VICINO");
            await lookVeryClose(x, y);
        }
        else if (message === "FAR_AWAY"){
            console.log("TROVATO NIENTE");
        }

        getFreeCells();
    }
}

const main = async () => {
    await signup();
    await getMap();
    getFreeCells();

    maxX = map[0].length-1;
    maxY = map.length-1;

    await lookForTreasure();
}

main().then(() => {console.log("FINE")});