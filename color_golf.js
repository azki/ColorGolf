/*global $, setTimeout*/
/*global require,module,process*/
/*global checkAround,initGame,simulationGo*/
var NO_UI = false;
if (!this.window) {
	NO_UI = true;
} else {
	require = {};
	module = {};
	process = {
		argv: []
	};
}
var SERVER_STAGE = process.argv[2] ? +process.argv[2] : 5;
var SERVER_URL = '';

var data = {
	color: [],
	mine: [],
	minesum: 1
};
var data2 = {
	cell: 0,
	turn: 0
};
var checkCache = [];
var animateBuffer = [];

var resetCheckCache = function () {
	var rowIndex;
	checkCache = [];
	for (rowIndex = 0; rowIndex < data2.cell; rowIndex += 1) {
		checkCache[rowIndex] = [];
	}
};
var initZone = function () {
	var rowIndex, cellIndex, arrIndex;
	data.color = [];
	data.mine = [];
	for (rowIndex = 0; rowIndex < data2.cell; rowIndex += 1) {
		for (cellIndex = 0; cellIndex < data2.cell; cellIndex += 1) {
			arrIndex = rowIndex * data2.cell + cellIndex;
			if (rowIndex + cellIndex === 0) {
				data.mine[arrIndex] = true;
				data.color[arrIndex] = 9;
			} else {
				data.mine[arrIndex] = false;
				data.color[arrIndex] = Math.floor(Math.random() * 6);
			}
		}
	}
};
var initData = function (cell) {
	data.color = [];
	data.mine = [];
	data2.cell = cell;
	initZone();
	resetCheckCache();
	data.minesum = 1;
	data2.turn = 0;
};
var createTable = function () {
	if (NO_UI) {
		return;
	}
	var tableElem, rowIndex, cellIndex, rowElem, cellElem, $div, halfSize, arrIndex;
	$("#zone").empty();
	tableElem = document.createElement("table");
	tableElem.cellSpacing = "0";
	tableElem.cellPadding = "0";
	halfSize = Math.floor(320 / data2.cell / 2);
	for (rowIndex = 0; rowIndex < data2.cell; rowIndex += 1) {
		rowElem = tableElem.insertRow(rowIndex);
		for (cellIndex = 0; cellIndex < data2.cell; cellIndex += 1) {
			cellElem = rowElem.insertCell(cellIndex);
			$div = $("<div>");
			if (rowIndex + cellIndex === 0) {
				$div.css("text-align", "center").css("font-size", halfSize + "px").text("H");
			}
			arrIndex = rowIndex * data2.cell + cellIndex;
			$div
			.removeClass()
			.addClass("color" + data.color[arrIndex])
			.height(320 / data2.cell).width(320 / data2.cell).appendTo(cellElem);
			if (data.mine[arrIndex]) {
				$div.css("border-radius", halfSize + "px").css("-moz-border-radius", halfSize + "px").css("-webkit-border-radius", halfSize + "px");
			}
		}
	}
	$("#zone").append(tableElem);
};
var drawStage = function () {
	if (NO_UI) {
		return;
	}
	$("#stage").text(data2.cell + "x" + data2.cell);
};
var drawTurn = function () {
	if (NO_UI) {
		return;
	}
	$("#turn").text(data2.turn);
};
var setMineBorder = function ($zone, size) {
	if (NO_UI) {
		return;
	}
	$zone.css("border-radius", size + "px");
};
var animateBorder = function ($zone, rowIndex, cellIndex) {
	if (NO_UI) {
		return;
	}
	var halfSize, bufIndex;
	halfSize = Math.floor(320 / data2.cell / 2);
	bufIndex = rowIndex * cellIndex + cellIndex;
	animateBuffer[bufIndex] = $zone;
	setTimeout(function () {
		var v;
		v = halfSize * 0.4;
		setMineBorder($zone, v);
		setTimeout(function () {
			var v;
			v = halfSize * 0.7;
			setMineBorder($zone, v);
			setTimeout(function () {
				v = halfSize;
				setMineBorder($zone, v);
				animateBuffer[bufIndex] = null;
			}, 80);
		}, 80);
	}, 80);
};
var get$zone = function (rowIndex, cellIndex) {
	if (0 <= rowIndex && rowIndex < data2.cell && 0 <= cellIndex && cellIndex < data2.cell) {
		if (!NO_UI) {
			var $zone = $("#zone div:eq(" + (data2.cell * rowIndex + cellIndex) + ")");
			return $zone.length ? $zone : null;
		} else {
			return true;
		}
	}
	return false;
};
var setColorToZone = function ($zone, rowIndex, cellIndex) {
	if (NO_UI) {
		return;
	}
	$zone
	.removeClass()
	.addClass("color" + data.color[rowIndex * data2.cell + cellIndex]);
};
var checkZone = function (rowIndex, cellIndex, newColorIndex) {
	var $zone = get$zone(rowIndex, cellIndex), arrIndex = rowIndex * data2.cell + cellIndex;
	if ($zone && checkCache[arrIndex] !== true) {
		if (data.mine[arrIndex] === true) {
			checkCache[arrIndex] = true;
			data.color[arrIndex] = newColorIndex;
			setColorToZone($zone, rowIndex, cellIndex);
			return checkAround(rowIndex, cellIndex, newColorIndex);
		} else {
			if (data.color[arrIndex] === newColorIndex) {
				checkCache[arrIndex] = true;
				data.mine[arrIndex] = true;
				data.minesum += 1;
				animateBorder($zone, rowIndex, cellIndex);
				return 1 + checkAround(rowIndex, cellIndex, newColorIndex);
			} else {
				checkCache[arrIndex] = true;
			}
		}
	}
	return 0;
};
var checkAround = function (rowIndex, cellIndex, newColorIndex) {
	var drawCount = 0;
	drawCount += checkZone(rowIndex + 1, cellIndex, newColorIndex);
	drawCount += checkZone(rowIndex, cellIndex + 1, newColorIndex);
	drawCount += checkZone(rowIndex - 1, cellIndex, newColorIndex);
	drawCount += checkZone(rowIndex, cellIndex - 1, newColorIndex);
	return drawCount;
};
var changeStage = function (plus) {
	var stage;
	stage = data2.cell + plus;
	if (stage < 2) {
		stage = 10;
	}
	if (10 < stage) {
		stage = 2;
	}
	initGame(stage);
};
var setBtn = function (index) {
	var drawCount, i, len, halfSize;
	drawCount = checkZone(0, 0, index);
	if (0 < drawCount) {
		data2.turn += 1;
		drawTurn();
	}
	if (data2.cell * data2.cell <= data.minesum) {
		//clear animation
		len = data2.cell * data2.cell;
		halfSize = Math.floor(320 / data2.cell / 2);
		for (i = 0; i < len; i += 1) {
			if (animateBuffer[i]) {
				setMineBorder(animateBuffer[i], halfSize);
			}
		}
		animateBuffer = [];
	} else {
		resetCheckCache();
	}
};
var createButtons = function () {
	if (NO_UI) {
		return;
	}
	var i, callbackFn, $div;
	$("#btns").empty();
	callbackFn = function () {
		setBtn($(this).data("index"));
	};
	for (i = 0; i < 6; i += 1) {
		if (i === 3) {
			$("<br>").appendTo($("#btns"));
		}
		$div = $("<div>")
		.addClass("color" + i)
		.data("index", i).appendTo($("#btns"));
		$div[0].onmousedown = callbackFn;
		$div[0].ontouchstart = callbackFn;
	}
};
var drawGame = function () {
	createTable();
	drawStage();
	drawTurn();
	createButtons();
};
var initGame = function (cell) {
	initData(cell);
	drawGame();
};

var ddGoal = 0;
var ddMap = {};
var ddd = function () {
	var startTime, noUiBack, s;
	s = data.color.join("");
	ddGoal = data2.cell * data2.cell;
	console.log(s);
	startTime = new Date();
	ddMap = {};
	noUiBack = NO_UI;
	NO_UI = true;
	simulationGo(JSON.stringify(data), 0);
	NO_UI = noUiBack;
	console.log(((new Date() - startTime) / 1000) + " sec");
	
	return JSON.stringify(ddMap, null, 2);
};
var simulationGo = function (s, w) {
	if (ddGoal <= data.minesum) {
		if (!ddMap[w]) {
			ddMap[w] = 1;
		} else {
			ddMap[w] += 1;
		}
	} else {
		var i;
		for (i = 0; i < 6; i += 1) {
			resetCheckCache();
			if (checkZone(0, 0, i)) {
				simulationGo(JSON.stringify(data), w + 1);
				data = JSON.parse(s);
			}
		}
	}
};

//loop code.
if (require.main === module) {
	var request, count, loop;
	SERVER_URL = require('fs').readFileSync('./serverurl.txt').toString().trim();
	console.log('SERVER_STAGE : ' + SERVER_STAGE);
	console.log('SERVER_URL : ' + SERVER_URL);
	request = require('request');
	ddGoal = SERVER_STAGE * SERVER_STAGE;
	count = 0;
	loop = function () {
		var s, n, startTime, spend, nArr, min, max, sumCount;
		initGame(SERVER_STAGE);
		s = data.color.join('');
		startTime = new Date();
		ddMap = {};
		simulationGo(JSON.stringify(data), 0);
		spend = new Date() - startTime;
		nArr = [];
		sumCount = 0;
		for (n in ddMap) {
			if (ddMap.hasOwnProperty(n)) {
				sumCount += ddMap[n];
				nArr.push(n);
			}
		}
		min = Math.min.apply(null, nArr);
		max = Math.max.apply(null, nArr);
		request.post({
			url: SERVER_URL,
			form: {
				cell: SERVER_STAGE,
				code: s,
				sum_c: sumCount,
				min: min,
				min_c: ddMap[min],
				max: max,
				max_c: ddMap[max],
				solve: JSON.stringify(ddMap),
				spend: spend
			}
		}, function (e, r, b) {
			if (e) {
				console.log('hul.. Error!!');
			}
			console.log(b || 'ok');
			process.nextTick(loop);
		});
		console.log('\t' + (count += 1) + '\t\t' + sumCount + '\t\t' + Math.round(spend / 1000) + ' sec\t\t' + (sumCount / spend));
		//setTimeout(loop, 1);
	};
	loop();
}