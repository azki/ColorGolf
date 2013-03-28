/*global window, $, setTimeout*/
/*global checkAround,initGame,dd2,dd3*/
if (!this.window) {
	window = {};
}
var data = {
	cell: 0,
	color: [],
	mine: [],
	minesum: 0,
	turn: 0,
	name: "",
	lock: 0
};
var checkCache = [];
var animateBuffer = [];
var NO_UI = false;

var viewHelp = function () {};
var viewRecord = function () {};
var resetCheckCache = function () {
	var rowIndex;
	checkCache = [];
	for (rowIndex = 0; rowIndex < data.cell; rowIndex += 1) {
		checkCache[rowIndex] = [];
	}
};
var initZone = function () {
	var rowIndex, cellIndex;
	for (rowIndex = 0; rowIndex < data.cell; rowIndex += 1) {
		data.color[rowIndex] = [];
		data.mine[rowIndex] = [];
		for (cellIndex = 0; cellIndex < data.cell; cellIndex += 1) {
			if (rowIndex + cellIndex === 0) {
				data.mine[rowIndex][cellIndex] = true;
				data.color[rowIndex][cellIndex] = 9;
			} else {
				data.mine[rowIndex][cellIndex] = false;
				data.color[rowIndex][cellIndex] = Math.floor(Math.random() * 6);
			}
		}
	}
};
var initData = function (cell) {
	data.color = [];
	data.mine = [];
	data.cell = cell;
	initZone();
	resetCheckCache();
	data.minesum = 1;
	data.turn = 0;
};
var createTable = function () {
	var tableElem, rowIndex, cellIndex, rowElem, cellElem, $div, halfSize;
	$("#zone").empty();
	tableElem = document.createElement("table");
	tableElem.cellSpacing = "0";
	tableElem.cellPadding = "0";
	halfSize = Math.floor(320 / data.cell / 2);
	for (rowIndex = 0; rowIndex < data.cell; rowIndex += 1) {
		rowElem = tableElem.insertRow(rowIndex);
		for (cellIndex = 0; cellIndex < data.cell; cellIndex += 1) {
			cellElem = rowElem.insertCell(cellIndex);
			$div = $("<div>");
			if (rowIndex + cellIndex === 0) {
				$div.css("text-align", "center").css("font-size", halfSize + "px").text("H");
			}
			$div
			.removeClass()
			.addClass("color" + data.color[rowIndex][cellIndex])
			.height(320 / data.cell).width(320 / data.cell).appendTo(cellElem);
			if (data.mine[rowIndex][cellIndex]) {
				$div.css("border-radius", halfSize + "px").css("-moz-border-radius", halfSize + "px").css("-webkit-border-radius", halfSize + "px");
			}
		}
	}
	$("#zone").append(tableElem);
};
var drawStage = function () {
	$("#stage").text(data.cell + "x" + data.cell);
};
var drawTurn = function (plus) {
	$("#turn").text(data.turn += (plus || 0));
};
var setMineBorder = function ($zone, size) {
	$zone.css("border-radius", size + "px");
};
var animateBorder = function ($zone, rowIndex, cellIndex) {
	var halfSize, bufIndex;
	halfSize = Math.floor(320 / data.cell / 2);
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
	if (!NO_UI) {
		var $zone = $("#zone div:eq(" + (data.cell * rowIndex + cellIndex) + ")");
		return $zone.length ? $zone : null;
	} else {
		return 0 <= rowIndex && rowIndex < data.cell && 0 <= cellIndex && cellIndex < data.cell;
	}
};
var checkZone = function (rowIndex, cellIndex, newColorIndex) {
	var $zone = get$zone(rowIndex, cellIndex);
	if ($zone && checkCache[rowIndex][cellIndex] !== true) {
		if (data.mine[rowIndex][cellIndex] === true) {
			checkCache[rowIndex][cellIndex] = true;
			data.color[rowIndex][cellIndex] = newColorIndex;
			if (!NO_UI) {
				$zone
				.removeClass()
				.addClass("color" + data.color[rowIndex][cellIndex]);
			}
			return checkAround(rowIndex, cellIndex, newColorIndex);
		} else {
			if (data.color[rowIndex][cellIndex] === newColorIndex) {
				checkCache[rowIndex][cellIndex] = true;
				data.mine[rowIndex][cellIndex] = true;
				data.minesum += 1;
				if (!NO_UI) {
					animateBorder($zone, rowIndex, cellIndex);
				}
				return 1 + checkAround(rowIndex, cellIndex, newColorIndex);
			} else {
				checkCache[rowIndex][cellIndex] = true;
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
	stage = data.cell + plus;
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
		drawTurn(1);
	}
	if (data.cell * data.cell <= data.minesum) {
		//clear animation
		len = data.cell * data.cell;
		halfSize = Math.floor(320 / data.cell / 2);
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

var ddMap = [];
var ddd = function () {
	var i, s = "";
	for (i = 0; i < data.cell; i += 1) {
		s += data.color[i].join("");
	}
	console.log(s);
	console.log(dd2());
	initGame(5);
	return JSON.stringify(ddMap, null, 2);
};
var dd2 = function () {
	var startTime = new Date();
	ddMap = [];
	NO_UI = true;
	dd3(JSON.stringify(data), "");
	NO_UI = false;
	return (new Date() - startTime) / 1000;
};
var dd3 = function (s, w) {
	if (data.cell * data.cell <= data.minesum) {
		if (!ddMap[w.length]) {
			ddMap[w.length] = 1;
		} else {
			ddMap[w.length] += 1;
		}
		return;
	}
	var i, s2, w2, drawCount;
	for (i = 0; i < 6; i += 1) {
		resetCheckCache();
		drawCount = checkZone(0, 0, i);
		if (drawCount) {
			s2 = JSON.stringify(data);
			w2 = w +  i;
			dd3(s2, w2);
			data = JSON.parse(s);
		}
	}
};