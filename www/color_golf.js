/*global window, document, $, alert, confirm, prompt, localStorage, setTimeout*/
/*global checkAround,initGame*/
var data = {
	row: 0,
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

var viewHelp = function () {
	var str;
	str = " - ColorGolf (" + location.href + ")\n";
	str += "모든 칸을 한가지 색상으로 점령하는 게임\n\n";
	str += "하단의 6개 버튼을 눌러보세용..\n";
	alert(str);
};
var viewRecord = function () {
	$("#topBtnPanel").hide();
	$("#topStatePanel").show();
	$.getJSON("http://cz.azki.org/history.jsonp.php?c=" + data.cell + "&callback=?", function (sdata) {
		var da, i, len, str;
		da = sdata.split("\t");
		len = da.length;
		str = "- " + data.row + "x" + data.cell + " 순위표 -\n";
		for (i = 0; i < len; i += 3) {
			if (da[i + 2]) {
				str += (i / 3 + 1) + "등. [" + da[i + 2] + "턴] " + da[i] + " (" + da[i + 1] + ")\n";
			}
		}
		alert(str);
		$("#topStatePanel").hide();
		$("#topBtnPanel").show();
	});
//	.error(function () {
//		alert("기록을 불러오는데 실패했어.\n인터넷이 잘되나 확인해봐.");
//		$("#topStatePanel").hide();
//		$("#topBtnPanel").show();
//	});
};
var resetCheckCache = function () {
	var rowIndex;
	checkCache = [];
	for (rowIndex = 0; rowIndex < data.row; rowIndex += 1) {
		checkCache[rowIndex] = [];
	}
};
var initZone = function () {
	var rowIndex, cellIndex;
	for (rowIndex = 0; rowIndex < data.row; rowIndex += 1) {
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
var initData = function (row, cell) {
	data.color = [];
	data.mine = [];
	data.row = row;
	data.cell = cell;
	initZone();
	resetCheckCache();
	data.minesum = 1;
	data.turn = 0;
	data.lock = 0;
};
var createTable = function () {
	var tableElem, rowIndex, cellIndex, rowElem, cellElem, $div, halfSize;
	$("#zone").empty();
	tableElem = document.createElement("table");
	tableElem.cellSpacing = "0";
	tableElem.cellPadding = "0";
	halfSize = Math.floor(320 / data.cell / 2);
	for (rowIndex = 0; rowIndex < data.row; rowIndex += 1) {
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
			.height(320 / data.row).width(320 / data.cell).appendTo(cellElem);
			if (data.mine[rowIndex][cellIndex]) {
				$div.css("border-radius", halfSize + "px").css("-moz-border-radius", halfSize + "px").css("-webkit-border-radius", halfSize + "px");
			}
		}
	}
	$("#zone").append(tableElem);
};
var drawStage = function () {
	$("#stage").text(data.row + "x" + data.cell);
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
		if (data.lock === -1) {
			return;
		}
		v = halfSize * 0.4;
		setMineBorder($zone, v);
		setTimeout(function () {
			var v;
			if (data.lock === -1) {
				return;
			}
			v = halfSize * 0.7;
			setMineBorder($zone, v);
			setTimeout(function () {
				if (data.lock === -1) {
					return;
				}
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
		return 0 <= rowIndex && rowIndex < data.row && 0 <= cellIndex && cellIndex < data.cell;
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
var clearSave = function () {
	//TODO.azki
	if (window.localStorage && localStorage.getItem("cz_game") !== null) {
		localStorage.removeItem("cz_game");
	}
};
var saveGame = function () {
	var s;
	//TODO.azki
	if (window.localStorage) {
		s = JSON.stringify(data);
		localStorage.setItem("cz_game", s);
		return true;
	}
	return false;
};
var changeStage = function (plus) {
	var stage;
	stage = data.cell + plus;
	if (stage < 5) {
		stage = 30;
	}
	if (30 < stage) {
		stage = 5;
	}
	clearSave();
	initGame(stage);
};
var saveName = function (name) {
	//TODO.azki
	if (window.localStorage) {
		localStorage.setItem("cz_name", name);
	}
};
var restoreName = function () {
	//TODO.azki
	if (window.localStorage) {
		data.name = localStorage.getItem("cz_name");
	}
};
var setBtn = function (index) {
	var drawCount, i, len, halfSize;
	if (data.lock < 0) {
		alert("게임이 이미 끝났어..");
		return;
	}
	if (0 < data.lock) {
		data.lock += 1;
		if (5 <= data.lock) { //error catch..
			changeStage(0);
		}
		return;
	}
	data.lock = 1;
	drawCount = checkZone(0, 0, index);
	if (0 < drawCount) {
		drawTurn(1);
	}
	if (data.row * data.cell <= data.minesum) {
		data.lock = -1; //end
		setTimeout(function () {
			var sendRecord;
			if (confirm("넌 '" + data.row + "x" + data.cell + "'를(을) " + data.turn + "턴으로 깼어.\n서버에 기록할래?")) {
				data.name = prompt("기록 올릴 이름을 입력해줘:", data.name);
				if (data.name) {
					sendRecord = function () {
						$("#topBtnPanel").hide();
						$("#topStatePanel").show();
						$.getJSON("http://cz.azki.org/record.jsonp.php?c=" + data.cell + "&t=" + data.turn + "&n=" + encodeURIComponent(data.name) + "&callback=?", function (sdata) {
							var da;
							da = sdata.split("\t");
							alert("기록에 성공했어.\n네 기록은 " + da[1] + "명 중에 " + da[0] + "등이래.\n대단한걸~");
							changeStage(0);
							$("#topStatePanel").hide();
							$("#topBtnPanel").show();
						});
//						.error(function() {
//							if (confirm("기록에 실패했어.\n기록 전송을 위해 서버 연결을 다시 시도할래?")) {
//								sendRecord();
//							} else {
//								changeStage(0);
//							}
//							$("#topStatePanel").hide();
//							$("#topBtnPanel").show();
//						});
					};
					sendRecord();
					saveName(data.name);
				} else {
					changeStage(0);
				}
			} else {
				changeStage(0);
			}
		}, 320);
		clearSave();
		//clear animation
		len = data.row * data.cell;
		halfSize = Math.floor(320 / data.cell / 2);
		for (i = 0; i < len; i += 1) {
			if (animateBuffer[i]) {
				setMineBorder(animateBuffer[i], halfSize);
			}
		}
		animateBuffer = [];
	} else {
		resetCheckCache();
		data.lock = 0;
		saveGame();
	}
};
var createButtons = function () {
	var i, callbackFn;
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
var loadGame = function () {
	var s, d;
	//TODO.azki
	if (window.localStorage) {
		s = localStorage.getItem("cz_game");
		d = JSON.parse(s);
		if (d !== null && d.lock === 0) {
			data = d;
			resetCheckCache();
			drawGame();
			return true;
		}
	}
	return false;
};
var initGame = function (cell) {
	initData(cell, cell);
	drawGame();
	//TODO.azki
	if (window.localStorage) {
		localStorage.setItem("cz_cell", data.cell);
	}
};
var getLastCell = function () {
	var lastCell;
	//TODO.azki
	if (window.localStorage) {
		lastCell = localStorage.getItem("cz_cell");
		if (lastCell) {
			return 1 * lastCell;
		}
	}
	return 5;
};


var ddd = function () {
	var i, s = "";
	for (i = 0; i < data.row; i += 1) {
		s += data.color[i].join("");
	}
	console.log(s);
	console.log(dd2());
	return JSON.stringify(ddMap, null, 2);
};
var ddMap = {};
var dd2 = function () {
	var startTime = new Date();
	ddMap = {};
	saveGame();
	NO_UI = true;
	dd3(JSON.stringify(data), "");
	NO_UI = false;
	loadGame();
	return (new Date() - startTime) / 1000;
};
var dd3 = function(s, w) {
	if (data.row * data.cell <= data.minesum) {
		if (!ddMap["c" + w.length]) {
			ddMap["c" + w.length] = 1;
		} else {
			ddMap["c" + w.length] += 1;
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