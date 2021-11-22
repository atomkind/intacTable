class intacTable
{
	#id;
	#data;
	#dataOriginal;
	#dataSort;
	#tbody;
	#heads;
	#checkVars;
	#options;
	#pagination;
	#listener;
	#collator;
	#sortCollate;
	#sortDate;
	#sortNumeric;
	#sortAlphaNum;
	#seite;

	constructor( id, heads = {}, options = {} )
	{
		this.#id = id;
		this.#data = [];
		this.#dataSort = [];
		this.#dataOriginal = [];
		this.#heads = this.#structureData( [ heads ] );
		this.#pagination = document.createElement( 'div' );
		this.#pagination.setAttribute( 'id', this.#id + 'Pagination' );
		this.#pagination.setAttribute( 'class', 'flex flexBetween flexStart' );
		this.#listener = this.#checkDropdown.bind( this );
		this.#collator = new Intl.Collator( 'de', { numeric: true, sensitivity: 'base' } );
		this.#sortCollate = (a, b) => this.#collator.compare(a.cellContent.toString().toUpperCase(), b.cellContent.toString().toUpperCase());
		this.#sortDate = (a, b) => {return new Date( a ) - new Date( b )};
		this.#sortNumeric = (a, b) => {return parseInt( a - b ) };
		this.#sortAlphaNum = ( a, b ) => {
			var nameA = a.cellContent.toString().toUpperCase();
			var nameB = b.cellContent.toString().toUpperCase();
			if (nameA < nameB) {
				return -1;
			}
			if (nameA > nameB) {
				return 1;
			}
			return 0;
		};

		this.#checkVars = {
			fa: typeof options.fa == 'boolean' ? options.fa : false,
			menuToggleview: typeof options.startWithToggleView == 'boolean' ? options.startWithToggleView : false,
			menuColumns: false,
			menuColumnSearch: typeof options.startWithColumnSearch == 'boolean' ? options.startWithColumnSearch : false,
			menuFullscreen: false,
			searching: false,
			columnSearchValues: [],
			showColumns: [],
			actualSort: {}
		};

		this.#options = {
			maxRows: typeof options.maxRows == 'number' ? options.maxRows : 10,
			showPagination: typeof options.showPagination == 'boolean' ? options.showPagination : true,
			paginationBtnAnzahlNext: typeof options.paginationBtnAnzahlNext == 'boolean' ? options.paginationBtnAnzahlNext : 3,
			paginationBtnTrenner: typeof options.paginationBtnTrenner == 'string' ? options.paginationBtnTrenner : '...',
			showSearch: typeof options.showSearch == 'boolean' ? options.showSearch : true,
			showSearchClearBtn: typeof options.showSearchClearBtn == 'boolean' ? options.showSearchClearBtn : true,
			showMenu: typeof options.showMenu == 'boolean' ? options.showMenu : true,
			showMenuBtnReload: typeof options.showMenuBtnReload == 'boolean' ? options.showMenuBtnReload : true,
			showMenuBtnToggleview: typeof options.showMenuBtnToggleview == 'boolean' ? options.showMenuBtnToggleview : true,
			showMenuBtnColumns: typeof options.showMenuBtnColumns == 'boolean' ? options.showMenuBtnColumns : true,
			showMenuBtnColumnSearch: typeof options.showMenuBtnColumnSearch == 'boolean' ? options.showMenuBtnColumnSearch : true,
			showMenuBtnFullscreen: typeof options.showMenuBtnFullscreen == 'boolean' ? options.showMenuBtnFullscreen : true,
			startWithToggleView: this.#checkVars.menuToggleview,
			startWithColumnSearch: this.#checkVars.menuColumnSearch,
			//	startSearchValue,
			//	startSearchColumnValues[],
			menuBtns: [ {
				name: 'Reload',
				id: 'intacTableMenuBtnReload',
				class: 'btn menuBtnReload bg-green',
				type: 'button',
				title: 'RELOAD',
				value: this.#checkVars.fa === false ? 'RELOAD' : '<i id="intacTableMenuBtnReloadIcon" class="fa fa-sync fa-fw fa-fg"></i>',
				clickFn: ( btn, _event ) => {
					//	empty search inputs
					document.getElementById( this.#id + 'SearchBtn' ).value = '';
					document.querySelectorAll( '#' + this.#id + 'Wrap .intacTableSearchColumnInput' ).forEach( elm => elm.value = '' );
					//	reset data to dataOriginal
					this.#data = JSON.parse( JSON.stringify( this.#dataOriginal ) );
					this.insertData( this.#dataOriginal );
					//	remove sort-arrows
					document.querySelectorAll( '#' + this.#id + 'Wrap .headColumnElmSort' ).forEach( elm => { elm.classList.remove( 'sort-asc' ); elm.classList.remove( 'sort-desc' ) } );
				}
			},{
				name: 'Columns',
				type: 'dropdown',
				button: {
					id: 'intacTableMenuBtnColumns',
					class: 'btn menuBtnColumns',
					type: 'button',
					title: 'COLUMNS',
					value: this.#checkVars.fa === false ? 'SPALTEN' : '<i id="intacTableMenuBtnColumnsIcon" class="fa fa-columns fa-fw fa-fg"></i>',
					clickFn: ( btn, _event ) => {
						if( document.getElementById( 'intacTableActiveDropdown' ) )
						{
							this.#closeDropdown();
						}
						else
						{
							btn.classList.add( 'clicked' );
							var dropdown = document.createElement( 'div' );
							dropdown.setAttribute( 'id', 'intacTableActiveDropdown' );
							dropdown.setAttribute( 'class', 'intacTableDropdown' );
							dropdown.setAttribute( 'data-btn', btn.id );
							for( var h = 0; h < this.#heads[ 0 ].rowContent.length; h++ )
							{
								var checkbox = document.createElement( 'input' );
								checkbox.setAttribute( 'id', 'intacTableToolbarColumn' + h );
								checkbox.setAttribute( 'type', 'checkbox' );
								checkbox.setAttribute( 'name', 'intacTableToolbarColumn' + h );
								checkbox.setAttribute( 'value', h );
								if( !document.querySelector( '#' + this.#id + 'Table .intacTableColumn' + h ).classList.contains( 'hide' ) )
								{
									checkbox.setAttribute( 'checked', 'checked' );
								}
								checkbox.addEventListener( 'change', ( event ) =>
								{
									var column = parseInt( event.target.value ),
										columnElm = document.querySelectorAll( '#' + this.#id + 'Table .intacTableColumn' + column );
									if( event.target.checked )
									{
										this.#checkVars.showColumns.push( column );
									}
									else
									{
										this.#checkVars.showColumns.splice( this.#checkVars.showColumns.indexOf( column ), 1 );
									}
									for( var c = 0; c < columnElm.length; c++ )
									{
										if( event.target.checked )
										{
											columnElm[ c ].classList.remove( 'hide' );
										}
										else
										{
											columnElm[ c ].classList.add( 'hide' );
										}
									}
								} );
								var menuRow = document.createElement( 'label' );
								menuRow.setAttribute( 'class', 'intacTableDropdownRow' );
								menuRow.setAttribute( 'for', 'intacTableToolbarColumn' + h );
								menuRow.appendChild( checkbox );
								menuRow.appendChild( document.createTextNode( typeof this.#heads[ 0 ].rowContent[ h ].cellContent != 'undefined'
																				? this.#heads[ 0 ].rowContent[ h ].cellContent
																				: this.#heads[ 0 ].rowContent[ h ] ) );
								dropdown.appendChild( menuRow );
							}
							btn.parentNode.insertBefore( dropdown, btn.nextSibling );
							document.addEventListener( 'click', this.#listener, true );
						}
					}
				}
			},{
				name: 'Fullscreen',
				id: 'intacTableMenuBtnFullscreen',
				class: 'btn menuBtnFullscreen',
				type: 'button',
				title: 'FULLSCREEN',
				value: this.#checkVars.fa === false ? 'VOLLBILD' : '<i id="intacTableMenuBtnFullscreenIcon" class="fa fa-expand-arrows-alt fa-fw fa-fg"></i>',
				clickFn: ( btn, _event ) => {
					var wrap = document.getElementById( this.#id + 'Wrap' );
					if( wrap.requestFullScreen )
					{
						if( !document.fullScreen )
						{
							wrap.requestFullscreen();
						}
						else
						{
							document.exitFullScreen();
						}
					}
					else if( wrap.mozRequestFullScreen )
					{
						if( !document.mozFullScreen )
						{
							wrap.mozRequestFullScreen();
						}
						else
						{
							document.mozCancelFullScreen();
						}
					}
					else if( wrap.webkitRequestFullScreen )
					{
						if( !document.webkitIsFullScreen )
						{
							wrap.webkitRequestFullScreen();
						}
						else
						{
							document.webkitCancelFullScreen();
						}
					}
					this.#changeFullscreen();
				}
			},{
				name: 'Toggleview',
				id: 'intacTableMenuBtnToggleview',
				class: 'btn menuBtnToggle' + ( this.#checkVars.menuToggleview === true ? ' clicked' : '' ),
				type: 'button',
				title: 'TOGGLEVIEW',
				value: this.#checkVars.fa === false ? 'ANSICHT' : '<i id="intacTableMenuBtnToggleviewIcon" class="fa fa-toggle-' + ( this.#checkVars.menuToggleview === true ? 'on' : 'off' ) + ' fa-fw fa-fg"></i>',
				clickFn: ( btn, _event ) => {
					this.#checkVars.menuToggleview = !this.#checkVars.menuToggleview;
					if( this.#checkVars.menuToggleview  === true )
					{
						btn.classList.add( 'clicked' );
						if( this.#checkVars.fa === true )
						{
							let icon = document.getElementById( 'intacTableMenuBtnToggleviewIcon' );
							icon.classList.remove( 'fa-toggle-off' );
							icon.classList.add( 'fa-toggle-on' );
						}
					}
					else
					{
						btn.classList.remove( 'clicked' );
						if( this.#checkVars.fa === true )
						{
							let icon = document.getElementById( 'intacTableMenuBtnToggleviewIcon' );
							icon.classList.remove( 'fa-toggle-on' );
							icon.classList.add( 'fa-toggle-off' );
						}
					}
					var thead = document.getElementById( this.#id + 'Tablehead' );
					thead.replaceWith( this.#createTablehead( thead ) );
					this.insertData( this.#data, this.#seite );
				}
			},{
				name: 'ColumnSearch',
				id: 'intacTableMenuBtnColumnSearch',
				class: 'btn menuBtnColumnSearch' + ( this.#checkVars.menuColumnSearch === true ? ' clicked' : '' ),
				type: 'button',
				title: 'SPALTENSUCHE',
				value: this.#checkVars.fa === false ? 'SPALTENSUCHE' : '<i id="intacTableMenuBtnColumnSearchIcon" class="fa fa-search-plus fa-fw fa-fg"></i>',
				clickFn: ( btn, _event ) => {
					this.#checkVars.menuColumnSearch = !this.#checkVars.menuColumnSearch;
					if( this.#checkVars.menuColumnSearch  === true )
					{
						btn.classList.add( 'clicked' );
					}
					else
					{
						btn.classList.remove( 'clicked' );
					}
					var thead = document.getElementById( this.#id + 'Tablehead' );
					thead.replaceWith( this.#createTablehead( thead ) );
					this.#searching();
				}
			} ]
		};

		this.#heads[ 0 ].rowContent.map( ( value, index ) => {
			this.#checkVars.columnSearchValues.push( '' );
			this.#checkVars.showColumns.push( index )
		} );

		var table = document.getElementById( this.#id ),
			wrap = document.createElement( 'div' );
		if ( !table )
		{
			throw new Error( 'No element with id "' + this.#id + '" found.' );
		}

		wrap.setAttribute( 'id', this.#id + 'Wrap' );
		wrap.setAttribute( 'class', 'intacTableWrap' );
		this.#createBase( wrap ).then(
			resolve => table.replaceWith( resolve )
		);
		document.addEventListener( 'fullscreenchange', this.#changeFullscreen.bind( this ), false );
		document.addEventListener( 'mozfullscreenchange', this.#changeFullscreen.bind( this ), false );
		document.addEventListener( 'webkitfullscreenchange', this.#changeFullscreen.bind( this ), false );
	}

	//	Daten Strukturieren
	//	****************************************************************************************************
	//	****************************************************************************************************
	#structureData( data )
	{
		var newData = [],
			rows = typeof data == 'object' ? Object.keys( data ).length : data.length;
		for( var r = 0; r < rows; r++ )
		{
			if( data[ r ] )
			{
				newData[ r ] = {
					rowID: typeof data[ r ].rowID != 'undefined' ? data[ r ].rowID : '',
					rowClass: typeof data[ r ].rowClass != 'undefined' ? data[ r ].rowClass : '',
					rowContent: []
				};
				var temp = typeof data[ r ].rowContent != 'undefined' ? data[ r ].rowContent : data[ r ],
					cells = typeof temp == 'object' ? Object.keys( temp ).length : temp.length;
				for( var c = 0; c < cells; c++ )
				{
					newData[ r ].rowContent[ c ] = {
						cellID: typeof temp[ c ].cellID != 'undefined' ? temp[ c ].cellID : '',
						cellClass: typeof temp[ c ].cellClass != 'undefined' ? temp[ c ].cellClass : '',
						cellContent: typeof temp[ c ].cellContent != 'undefined' ? temp[ c ].cellContent : temp[ c ]
					};
				}
			}
			else
			{
				newData[ r ] = null;
			}
		}
		return newData;
	}


	//	Remove active Menu-Dropdowns when click on document
	//	****************************************************************************************************
	//	****************************************************************************************************
	#checkDropdown( event )
	{
		var target = event.target,
			i = 0,
			parents = document.querySelectorAll( '#' + this.#id + 'Wrap .intacTableDropdownBtn' ),
			close = true;
		for( i; i < parents.length; i++ )
		{
			if( parents[ i ] !== target && parents[ i ].contains( target ) )
			{
				close = false;
			}
		}
		if( close === true )
		{
			this.#closeDropdown();
		}
	}

	//	Dropdown entfernen
	//	****************************************************************************************************
	//	****************************************************************************************************
	#closeDropdown()
	{
		var drop = document.getElementById( 'intacTableActiveDropdown' );
		if( drop )
		{
			drop.remove();
			document.getElementById( drop.dataset.btn ).classList.remove( 'clicked' );
			document.removeEventListener( 'click', this.#listener, true );
		}
	}


	//	createBase  //  Search, Menu/Toolbar, Table-Head, Table-Body, Pagination
	//	****************************************************************************************************
	//	****************************************************************************************************
	#createBase( wrap )
	{
		if( this.#options.showSearch === true || this.#options.showMenu === true )
		{
			var toolbar = document.createElement( 'div' );
			toolbar.setAttribute( 'id', this.#id + 'Toolbar' );
			toolbar.setAttribute( 'class', 'flex flexBetween flexStart' );
			//  Suche-Input
			if( this.#options.showSearch === true )
			{
				var suchWrap = document.createElement( 'div' ),
					input = document.createElement( 'input' );
					suchWrap.setAttribute( 'class', 'btn-group' );
				input.setAttribute( 'id', this.#id + 'SearchBtn' );
				input.setAttribute( 'class', 'btn-search' );
				input.setAttribute( 'name', 'Suchen' );
				input.setAttribute( 'type', 'text' );
				input.setAttribute( 'size', '10' );
				input.addEventListener( 'mouseup', this.#searching.bind( this ) );
				input.addEventListener( 'keyup', this.#searching.bind( this ) );
				suchWrap.appendChild( input );
				//  Suche-Clear
				if( this.#options.showSearchClearBtn === true )
				{
					var btn = document.createElement( 'button' );
					btn.setAttribute( 'class', 'btn' );
					btn.setAttribute( 'name', 'reset' );
					btn.setAttribute( 'title', 'reset' );
					btn.setAttribute( 'type', 'button' );
					btn.innerHTML = '<i class="fa fa-trash-alt fa-fw fa-fg">' + ( this.#checkVars.fa === false ? 'X' : '' ) + '</i>';
					btn.addEventListener( 'click', function( _event )
					{
						input.value = '';
						this.#searching();
					}.bind( this ) );
					suchWrap.append( btn );
				}
				toolbar.append( suchWrap );
			}
			//  Menu
			if( this.#options.showMenu === true )
			{
				var menuDiv = document.createElement( 'div' ),
					btns = this.#options.menuBtns;
				menuDiv.setAttribute( 'id', this.#id + 'Menu' );
				menuDiv.setAttribute( 'class', 'btn-group' );
				for( var i = 0; i < btns.length; i++ )
				{
					if( this.#options[ 'showMenuBtn' + btns[ i ].name ] === true )
					{
						var btn = document.createElement( 'button' ),
							menuEntry = btns[ i ];
						if( btns[ i ].type == 'dropdown' )
						{
							var btnWrap = document.createElement( 'div' );
							btnWrap.setAttribute( 'class', 'intacTableDropdownBtn' );
							menuEntry = btns[ i ].button;
						}
						btn.setAttribute( 'type', 'button' );
						btn.setAttribute( 'id', menuEntry.id );
						btn.setAttribute( 'class', menuEntry.class );
						btn.setAttribute( 'title', menuEntry.title );
						if( typeof menuEntry.clickFn == 'function' )
						{
							btn.addEventListener( 'click', menuEntry.clickFn.bind( this, btn ) );
						}
						btn.innerHTML = menuEntry.value;
						if( btns[ i ].type == 'dropdown' )
						{
							btnWrap.append( btn );
							menuDiv.append( btnWrap );
						}
						else
						{
							menuDiv.append( btn );
						}
					}
				}
				toolbar.append( menuDiv );
			}
			wrap.append( toolbar );
		}

		//	Table
		var table = document.createElement( 'table' );
		table.setAttribute( 'id', this.#id + 'Table' );

		//  Table-Head
		var thead = document.createElement( 'thead' );
		thead.setAttribute( 'id', this.#id + 'Tablehead' );
		//ext.function for thead content!!
		table.append( this.#createTablehead( thead ) );

		//  Table-Body
		this.#tbody = document.createElement( 'tbody' );
		this.#tbody.setAttribute( 'id', this.#id + 'Tablebody' );
		table.append( this.#tbody );
		wrap.append( table );

		//  Pagination
		if( this.#options.showPagination === true )
		{
			wrap.append( this.#pagination );
		}

		return new Promise( function( resolve, reject )
		{
			resolve( wrap );
		} );
	}

	//	Tabellenkopf erstellen
	//	****************************************************************************************************
	//	****************************************************************************************************
	#createTablehead( thead )
	{
		thead.innerHTML = '';
		if( this.#checkVars.menuToggleview === true )
		{
			var tr = document.createElement( 'tr' ),
				th = document.createElement( 'th' );
			if( this.#checkVars.menuColumnSearch === true )
			{
				for( var i = 0; i < this.#heads[ 0 ].rowContent.length; i++ )
				{
					var row = document.createElement( 'div' ),
						label = document.createElement( 'label' ),
						input = document.createElement( 'input' );
					label.setAttribute( 'for', 'intacTableSearchColumnInput' + i );
					label.classList.add( 'headColumnElmSort' );
					label.classList.add( 'headColumnElm' + i );
					label.classList.add( 'intacTableColumn' + i );
					if( typeof this.#checkVars.actualSort.column == 'number' )
					{
						if( this.#checkVars.actualSort.column == i )
						{
							label.classList.add( 'sort-' + this.#checkVars.actualSort.sort );
						}
					}
					label.innerHTML = this.#heads[ 0 ].rowContent[ i ].cellContent;
					label.addEventListener( 'click', this.#sort.bind( this, i, label ), true );
					input.setAttribute( 'id', 'intacTableSearchColumnInput' + i );
					input.setAttribute( 'class', 'intacTableSearchColumnInput intacTableColumn' + i );
					input.setAttribute( 'data-column', i );
					input.setAttribute( 'name', 'intacTableSearchColumnInput' + i );
					input.setAttribute( 'type', 'text' );
					input.value = this.#checkVars.columnSearchValues[ i ];
					input.addEventListener( 'mouseup', this.#searching.bind( this ) );
					input.addEventListener( 'keyup', this.#searching.bind( this ) );
					if( this.#checkVars.showColumns.indexOf( i ) == '-1' )
					{
						label.classList.add( 'hide' );
						input.classList.add( 'hide' );
					}
					row.append( label );
					row.append( input );
					th.append( row );
				}
			}
			tr.append( th );
			thead.append( tr );
		}
		else
		{
			var tr = document.createElement( 'tr' );
			for( var i = 0; i < this.#heads[ 0 ].rowContent.length; i++ )
			{
				th = document.createElement( 'th' );
				th.setAttribute( 'class', 'intacTableColumn' + i );
				if( this.#checkVars.showColumns.indexOf( i ) == '-1' )
				{
					th.classList.add( 'hide' );
				}
				var text = document.createElement( 'div' );
				text.innerHTML = this.#heads[ 0 ].rowContent[ i ].cellContent;
				text.classList.add( 'headColumnElmSort' );
				text.classList.add( 'headColumnElm' + i );
				if( typeof this.#checkVars.actualSort.column == 'number' )
				{
					if( this.#checkVars.actualSort.column == i )
					{
						text.classList.add( 'sort-' + this.#checkVars.actualSort.sort );
					}
				}
				text.addEventListener( 'click', this.#sort.bind( this, i, text ), true );
				th.append( text );
				if( this.#checkVars.menuColumnSearch === true )
				{
					var input = document.createElement( 'input' );
					input.setAttribute( 'id', 'intacTableSearchColumnInput' + i );
					input.setAttribute( 'class', 'intacTableSearchColumnInput intacTableColumn' + i );
					input.setAttribute( 'data-column', i );
					input.setAttribute( 'name', 'intacTableSearchColumnInput' + i );
					input.setAttribute( 'type', 'text' );
					input.value = this.#checkVars.columnSearchValues[ i ];
					input.addEventListener( 'mouseup', this.#searching.bind( this ) );
					input.addEventListener( 'keyup', this.#searching.bind( this ) );
					th.append( input );
				}
				tr.append( th );
			}
			thead.append( tr );
		}
		return thead;
	}

	//	SORTIEREN
	//	****************************************************************************************************
	//	****************************************************************************************************
	#sort( column, headElm )
	{
		//	build sorting object
		this.#dataSort = [];
		for( var row = 0; row < this.#data.length; row++ )
		{
			if( this.#data[ row ] )
			{
				this.#dataSort.push( {
					// (<.*>) entfernen zum sortieren!
					cellContent: this.#data[ row ].rowContent[ column ].cellContent.toString().replace( /(\<([^>]+)\>)/ig, '' ),
					index: row
				} );
			}
		}

		//	sort!
		this.#dataSort.sort( this.#sortCollate );


		//	update table(head) & insert sorted data
		let allHeads = document.querySelectorAll( '#' + this.#id + 'Wrap  .headColumnElmSort' ),
			columnHeads = document.querySelectorAll( '#' + this.#id + 'Wrap  .headColumnElm' + column ),
			order = 'asc',
			newData = [];
		if( headElm.classList.contains( 'sort-asc' ) )
		{
			order = 'desc';
			this.#dataSort.reverse();
		}
		this.#checkVars.actualSort = { column: column, sort: order };
		allHeads.forEach( elm => { elm.classList.remove( 'sort-asc' ); elm.classList.remove( 'sort-desc' ) } );
		columnHeads.forEach( elm => elm.classList.add( 'sort-' + order ) );
		//	push sorted data
		for( i = 0; i < this.#dataSort.length; i++ )
		{
			newData.push( this.#data[ this.#dataSort[ i ].index ] );
		}
		this.#data = newData;
		this.insertData( newData );
	}

	//	Suche
	//	****************************************************************************************************
	//	****************************************************************************************************
	#searching()
	{
		if( this.#dataOriginal.length )
		{
			let data = JSON.parse( JSON.stringify( this.#dataOriginal ) ),
				searchFieldValue = document.getElementById( this.#id + 'SearchBtn' ).value;
			if( searchFieldValue.length > 0 )
			{
				this.#data = [];
				this.#checkVars.searching = true;
				for( var searchRow = 0; searchRow < this.#dataOriginal.length; searchRow++ )
				{
					var found = false;
					for( var searchCell = 0; searchCell < this.#heads[ 0 ].rowContent.length; searchCell++ )
					{
						var answer = this.#searchingCell( searchFieldValue, searchRow, searchCell );
						if( answer.foundSomething === true )
						{
							found = true;
							data[ searchRow ].rowContent[ searchCell ].cellContent = answer.cellContent;
						}
						else
						{
							data[ searchRow ].rowContent[ searchCell ].cellContent = this.#dataOriginal[ searchRow ].rowContent[ searchCell ].cellContent;
						}
					}
					if( found == true )
					{
						//	zusätzlich this.data verwenden mit den daten aus this.dataOriginal aber nur die Zeilen, in denen etwas gefunden wurde
						this.#data.push( data[ searchRow ] );
					}
					else
					{
						this.#data[ searchRow ] = null;
					}
				}
				
			}
			else if( this.#checkVars.searching === true )
			{
				//	zurücksetzen
				this.#data = JSON.parse( JSON.stringify( this.#dataOriginal ) );
				this.#checkVars.searching = false;
			}
			this.insertData( this.#data, this.#seite );
		}
		if( this.#checkVars.menuColumnSearch === true )
		{
			//	Spalten-Suche
			this.#searchingColumn();
		}
	}

	//	Spalten-Suche
	//	****************************************************************************************************
	//	****************************************************************************************************
	#searchingColumn()
	{
		var columnInputs = document.querySelectorAll( '#' + this.#id + 'Tablehead .intacTableSearchColumnInput' ),
			search = false;
		for( var i = 0; i < columnInputs.length; i++ )
		{
			var spalte = columnInputs[ i ].dataset.column,
				value = columnInputs[ i ].value;
			this.#checkVars.columnSearchValues[ i ] = value;
			if( value.length > 0 )
			{
				search = true;
				this.#checkVars.searching = true;
				for( var row = 0; row < this.#data.length; row++ )
				{
					if( this.#data[ row ] )
					{
						var answer = this.#searchingCell( value, row, spalte, true );
						if( answer.foundSomething === true )
						{
							this.#data[ row ].rowContent[ spalte ].cellContent = answer.cellContent;
						}
						else
						{
							this.#data[ row ] = null;
						}
					}
				}
			}
		}
		if( search === true )
		{
			this.insertData( this.#data );
		}
	}

	//	Suche in Zelle
	//	****************************************************************************************************
	//	****************************************************************************************************
	#searchingCell( searchFieldValue, row, column, second = false )
	{
		let str = this.#dataOriginal[ row ].rowContent[ column ].cellContent.toString().toLowerCase(),
			find = searchFieldValue.toLowerCase(),
			idx = -1,
			newCell = '',
			found = false,
			start = 0;
		while( ( idx = str.indexOf( find, idx + 1 ) ) != -1 )
		{
			found = true;
			newCell += this.#dataOriginal[ row ].rowContent[ column ].cellContent.substring( start, idx )
						+ ( second === false ? '<mark>' : '<span class="mark2">' )
							+ this.#dataOriginal[ row ].rowContent[ column ].cellContent.substring( idx, idx + searchFieldValue.length )
						+ ( second === false ? '</mark>' : '</span>' );
			start = idx + searchFieldValue.length;
		}
		if( found !== false )
		{
			newCell += this.#dataOriginal[ row ].rowContent[ column ].cellContent.substring( start )
		}
		return {
			foundSomething: found,
			cellContent: newCell
		}
	}

	//	Fullscreen
	//	****************************************************************************************************
	//	****************************************************************************************************
	#changeFullscreen()
	{
		let wrap = document.getElementById( this.#id + 'Wrap' ),
			btnFS = document.getElementById( 'intacTableMenuBtnFullscreen' );
		if( document.fullscreenElement !== null )
		{
			btnFS.classList.add( 'clicked' );
			if( this.#checkVars.fa === true )
			{
				let iconFS = document.getElementById( 'intacTableMenuBtnFullscreenIcon' );
				iconFS.classList.remove( 'fa-expand-arrows-alt' );
				iconFS.classList.add( 'fa-compress-arrows-alt' );
			}
			wrap.classList.add( 'fullscreen' );
		}
		else
		{
			btnFS.classList.remove( 'clicked' );
			if( this.#checkVars.fa === true )
			{
				let iconFS = document.getElementById( 'intacTableMenuBtnFullscreenIcon' );
				iconFS.classList.remove( 'fa-compress-arrows-alt' );
				iconFS.classList.add( 'fa-expand-arrows-alt' );
			}
			wrap.classList.remove( 'fullscreen' );
		}
	}

	//	Zellen vorbereiten
	//	****************************************************************************************************
	//	****************************************************************************************************
	#processCell( obj, columnNr, type = 'td' )
	{
		var cell = document.createElement( type ),
			cls = obj.cellClass !== ''
						? obj.cellClass + ' intacTableColumn' + columnNr
						: 'intacTableColumn' + columnNr;
		if( columnNr !== '' )
		{
			if( this.#checkVars.showColumns.indexOf( parseInt( columnNr ) ) == '-1' )
			{
				cls += ' hide';
			}
		}
		if( cls !== '' )
		{
			cell.setAttribute( 'class', cls );
		}
		if( obj.cellID !== '' )
		{
			cell.setAttribute( 'id', obj.cellID );
		}
		cell.innerHTML = obj.cellContent;
		return cell;
	}

	//	Daten einfügen
	//	****************************************************************************************************
	//	****************************************************************************************************
	insertData( data, seite = 1 )
	{
		if( typeof data == 'object' )
		{
			this.#seite = seite;
			data = this.#structureData( data );
			if( !this.#dataOriginal.length )
			{
				this.#dataOriginal = JSON.parse( JSON.stringify( data ) );
			}
			if( !this.#data.length )
			{
				this.#data = JSON.parse( JSON.stringify( data ) );
			}
			var newData = [],
				data = this.#data.filter( el => {return el != null} ),
				start = Math.ceil( ( seite - 1 ) * this.#options.maxRows ),
				stop = start + parseInt( data.length > this.#options.maxRows ? this.#options.maxRows : data.length );
			this.#tbody.innerHTML = '';
			for( start; start < stop; start++ )
			{
				var y = start;
				if( data[ y ] )
				{
					var row = document.createElement( 'tr' )
					if( data[ y ].rowID !== '' )
					{
						row.setAttribute( 'id', data[ y ].rowID );
					}
					if( data[ y ].rowClass !== '' )
					{
						row.setAttribute( 'class', data[ y ].rowClass );
					}
					if( this.#checkVars.menuToggleview === true )
					{
						var zelle = document.createElement( 'td' );
						zelle.setAttribute( 'class', 'grid formGrid' );
						for( var x = 0; x < this.#heads[ 0 ].rowContent.length; x++ )
						{
							var headCell = this.#processCell( this.#heads[ 0 ].rowContent[ x ], x, 'div' );
							headCell.classList.add( 'headColumnElmSort' );
							headCell.classList.add( 'headColumnElm' + x );
							if( typeof this.#checkVars.actualSort.column == 'number' )
							{
								if( this.#checkVars.actualSort.column == x )
								{
									headCell.classList.add( 'sort-' + this.#checkVars.actualSort.sort );
								}
							}
							headCell.addEventListener( 'click', this.#sort.bind( this, x, headCell ), true );
							zelle.appendChild( headCell );
							zelle.appendChild( this.#processCell( data[ y ].rowContent[ x ], x, 'div' ) );
						}
						row.appendChild( zelle );
					}
					else
					{
						for( var x = 0; x < this.#heads[ 0 ].rowContent.length; x++ )
						{
							row.appendChild( this.#processCell( data[ y ].rowContent[ x ], x ) );
						}
					}
					this.#tbody.appendChild( row );
					newData.push( data[ y ] );
				}
			}


			//	Pagination
			if( this.#options.showPagination === true )
			{
				var count = this.#options.paginationBtnAnzahlNext * 2 + 3,
					pages = Math.ceil( data.length / this.#options.maxRows ),
					startRechts = Math.ceil( pages - 1 ),
					trennungBefore = Math.ceil( 2 + Number( this.#options.paginationBtnAnzahlNext ) ),
					trennungAfter = Math.ceil( pages - trennungBefore ),
					beforeSeite = Math.ceil( Number( seite ) - Number( this.#options.paginationBtnAnzahlNext ) ),
					afterSeite = Math.ceil( Number( seite ) + Number( this.#options.paginationBtnAnzahlNext ) ),
					select = document.createElement( 'select' ),
					div = document.createElement( 'div' );
				div.classList.add( 'btn-group' );

				//	1 seite zurück
				var btn = document.createElement( 'button' );
				btn.value = Number( seite ) - 1;
				btn.innerHTML = '&lt;';
				btn.classList.add( 'btn' );
				if( seite == 1 )
				{
					btn.setAttribute( 'disabled', 'disabled' );
				}
				else
				{
					btn.addEventListener( 'click', this.#jumpToPage.bind( this, btn ) );
				}
				div.append( btn );

				for( var i = 1; i <= pages; i++ )
				{
					//	select-options
					var option = document.createElement( 'option' );
					option.value = i;
					option.innerHTML = i;
					if( i == seite )
					{
						option.setAttribute( 'selected', 'selected' );
					}
					select.append( option );

					//	page-buttons
					if( i == 1 ||	//	erste Seite immer anzeigen
						i == pages ||	//	letzte Seite immer anzeigen
						( i >= beforeSeite && i <= afterSeite )	//	aktuelle Seite +- btnNext
					)
					{
						var btn = document.createElement( 'button' );
						btn.value = i;
						btn.innerHTML = i;
						btn.classList.add( 'btn' );
						if( i == seite )
						{
							btn.classList.add( 'clicked' );
						}
						btn.addEventListener( 'click', this.#jumpToPage.bind( this, btn ) );
						div.append( btn );
					}
					//	button-trenner
					if( ( i == 1 && seite > trennungBefore ) || ( i == startRechts && seite <= trennungAfter ) )
					{
						div.append( document.createTextNode( this.#options.paginationBtnTrenner ) );
					}
				}

				//	1 seite vor
				var btn = document.createElement( 'button' );
				btn.value = Number( seite ) + 1;
				btn.innerHTML = '&gt;';
				btn.classList.add( 'btn' );
				if( seite == pages )
				{
					btn.setAttribute( 'disabled', 'disabled' );
				}
				else
				{
					btn.addEventListener( 'click', this.#jumpToPage.bind( this, btn ) );
				}
				div.append( btn );

				select.addEventListener( 'change', this.#jumpToPage.bind( this, select ) );
				this.#pagination.replaceChildren( select, div );
			}
		}
		else
		{
			throw new Error( 'insertData requesting type of object' );
		}
	}

	//	Zu Seite springen
	//	****************************************************************************************************
	//	****************************************************************************************************
	#jumpToPage( elm )
	{
		this.insertData( this.#data, elm.value );
	}
}


var test = new intacTable( 'test', {
	rowID: 'headRowID',
	rowClass: 'headRowClass',
	rowContent: [
		'row',
		{
			cellID: 'headID',
			cellClass: 'headCls',
			cellContent: 'head1'
		},
		'head2',
		'head3'
	]
}, {
	maxRows: 10,
	startWithColumnSearch: true
} );


var foo = [];
for( var i = 0; i <= 300; i++ )
{
	var row = {
		rowClass: 'testRowCls',
		rowID: 'testRowID' + i,
		rowContent: [ 'row' + i ]
	};
	for( var x = 2; x <= 4; x++ )
	{
		row.rowContent.push( {
				cellClass: 'testCellCls',
				cellID: 'testCellId_' + i + '_' + x,
				cellContent: 'cell' + x + ' Content'
			} );

	}
	foo.push( row );
}
foo.push([
		'a like',
		'1 test',
		'4',
		9
	]);
test.insertData( foo );





