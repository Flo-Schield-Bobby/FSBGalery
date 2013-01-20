/**
 *
 * HTML5 Templatable Image Galery (jQuery plugin)
 *
 * Author: Florent SCHILDKNECHT 2013
 *
 * Dependencies:
 * - jQuery >= 1.7.2
 *
 */

// JavaScript non-bloquant debuging
function debug(error) {
	if (console && console.log) {
		console.log('DEBUG', error);
	} else {
		alert('DEBUG' + error);
	}
};
// Make sure Object.create is available in the browser (for our prototypal inheritance)
// Courtesy of Douglas Crockford
if (typeof Object.create !== 'function') {
    Object.create = function (object) {
        function F() {}
        F.prototype = object;
        return new F();
    };
}
(function ($) {
	'use strict';
	var FSBGalery = {
		init: function (element, config) {
			this.settings = config;
			this.wrapper = $(element);
			this.currentItemIndice = this.settings.currentItemIndice;
			this.showLoader();
			this.direction = 0;
			this.locked = false;
			this.diaporama = config.autoplay;
			if ((this.settings.fromJson !== false) && (typeof this.settings.fromJson == 'string')) {
				$.getJSON(this.settings.fromJson, function (data) {
					this.initWithData(data);
				});
			} else if (this.settings.data.length > 0) {
				this.initWithData(this.settings.data);
			} else {
				debug('Hum, there is currently no data to manage.');
			}
			return this;
		},
		showLoader: function () {
			var loader = $('<figure/>', {
				class: 'fsb-loader-container'
			}).append($('<img/>', {
				src: 'assets/images/loader.gif',
				class: 'fsb-loader'
			})).appendTo(this.wrapper);
		},
		hideLoader: function () {
			$('.fsb-loader-container').remove();
		},
		initWithData: function (data) {
			// Data should be an array of strings, or an array of JSON objects
			this.data = data;
			// Insert data items into the DOM
			this.dataContainer = $('<div/>', {
				class: 'fsb-galery-data-container'
			}).prependTo(this.wrapper);

			var firstItem = this.addItem(0, data[0]).addClass('active');

			// Title and description if user wants
			if (this.settings.showTitle || this.settings.showDescription) {
				this.informationsWrapper = $('<div/>', {
					class: 'fsb-galery-informations'
				}).appendTo(this.wrapper);
				if (this.settings.showTitle) {
					this.titleContainer = $('<div/>', {
						class: 'fsb-galery-informations-title'
					}).html(data[0].filename).appendTo(this.informationsWrapper);
				}
				if (this.settings.showDescription) {
					this.descriptionContainer = $('<div/>', {
						class: 'fsb-galery-informations-description'
					}).html(data[0].description).appendTo(this.informationsWrapper);
				}
			}

			// Insert controls block into the DOM if user wants
			if (this.settings.showControls) {
				this.displayControls();
			}
			if (this.settings.showNavigation || this.settings.showThumbnails) {
				this.navigationWrapper = $('<div/>', {
					class: 'fsb-galery-navigation-wrapper'
				}).appendTo(this.wrapper);
				// Insert navigation pins into the DOM if user wants
				var navigationWrapperHeight = 0;
				if (this.settings.showNavigation) {
					this.displayNavigation();
					navigationWrapperHeight += 25;
				}
				// Insert thumbnails into the DOM if user wants
				if (this.settings.showThumbnails) {
					this.displayThumbnails();
					navigationWrapperHeight += 50;
				}
				this.navigationWrapper.css('height', navigationWrapperHeight);
			}
			// And here we GO !
			this.hideLoader();
			var self = this;
			if (this.diaporama) {
				this.diaporamaTimeout = setTimeout(function () {
					self.showNextItem();
				}, this.settings.diaporamaPeriod);
			}
		},
		addItem: function (indice, itemData) {
			var src = itemData.folder + itemData.filename + itemData.extension,
				item = $('<div/>', {
					class: 'fsb-galery-data-item'
				}).html($('<img/>', {
					src: src,
					alt: itemData.description
				})).appendTo(this.dataContainer);
			return item;
		},
		displayControls: function () {
			var self = this;
			// Container
			this.controlsContainer = $('<div/>', {
				class: 'fsb-galery-controls'
			}).appendTo(this.wrapper);
			// Control bar
			if (this.settings.showControlsBar) {
				this.controlsBar = $('<div/>', {
					class: 'fsb-galery-controls-bar'
				}).appendTo(this.controlsContainer);
				if (this.settings.counter) {
					this.counter = $('<div/>', {
						class: 'fsb-galery-counter'
					}).appendTo(self.controlsBar);
					this.counter.currentItem = $('<span/>', {
						class: 'fsb-galery-counter-current'
					}).html(self.currentItemIndice + 1).appendTo(this.counter);
					this.counter.separator = $('<span/>', {
						class: 'fsb-galery-counter-separator'
					}).html('/').appendTo(this.counter);
					this.counter.totalItems = $('<span/>', {
						class: 'fsb-galery-counter-total'
					}).html(self.data.length).appendTo(this.counter);
				}
			}
			// Previous arrow
			this.previousLink = $('<a/>', {
				href: '#',
				id: 'fsb-galery-controls-previous'
			}).html('&lsaquo;').appendTo(this.controlsContainer);
			// Next arrow
			this.nextLink = $('<a/>', {
				href: '#',
				id: 'fsb-galery-controls-next'
			}).html('&rsaquo;').appendTo(this.controlsContainer);
			this.diaporamaLink = $('<a/>', {
				href: '#',
				id: 'fsb-galery-diaporama-link'
			}).append($('<img/>', {
				src: 'assets/images/icon-repeat.png',
				alt: 'Autoplay Icon'
			})).prependTo(this.controlsBar);
			// Bind click events
			$(this.previousLink).on('click', function () {
				self.showPreviousItem();
				return false;
			});
			$(this.nextLink).on('click', function () {
				self.showNextItem();
				return false;
			});
			$(this.diaporamaLink).on('click', function () {
				self.diaporama = !self.diaporama;
				$(this).toggleClass('active');
				if (self.diaporama !== true) {
					window.clearTimeout(self.diaporamaTimeout);
				} else {
					self.diaporamaTimeout = setTimeout(function () {
						self.showNextItem();
					}, self.settings.diaporamaPeriod);
				}
				return false;
			})
		},
		displayNavigation: function () {
			var self = this;
			this.navigationContainer = $('<div/>', {
				class: 'fsb-galery-navigation'
			}).appendTo(this.navigationWrapper);
			// Foreach item, add a pin
			for (var i = 0; i < this.data.length; i++) {
				this.addPin(i, this.data[i]);
			}
			$(this.navigationContainer).find('.fsb-galery-navigation-item').on('click', function (clickEvent) {
				if ((self.locked !== true) && ($(this).attr('data-slide') != self.currentItemIndice)) {
					if (self.settings.animation == 'slide') {
						self.direction = (self.currentItemIndice < $(this).attr('data-slide') ? -1 : 1);
					}
					self.currentItemIndice = self.getIndice($(this).attr('data-slide'));
					self.showItem();
				}
				return false;
			});
		},
		addPin: function (indice, item) {
			var pin = $('<a/>', {
				href: '#',
				class: 'fsb-galery-navigation-item' + (indice == 0 ? ' active' : ''),
				'data-slide': indice
			}).html(indice + 1).appendTo(this.navigationContainer);
		},
		displayThumbnails: function () {
			var self = this;
			this.thumbnailsContainer = $('<div/>', {
				class: 'fsb-galery-thumbnails'
			}).appendTo(this.navigationWrapper);
			for (var i = 0; i < this.data.length; i++) {
				this.addThumbnail(i, this.data[i]);
			}
			$(this.thumbnailsContainer).find('.fsb-galery-thumbnail-item').on('click', function (clickEvent) {
				if ((self.locked !== true) && ($(this).attr('data-slide') != self.currentItemIndice)) {
					self.diaporama = false;
					if (self.settings.animation == 'slide') {
						self.direction = (self.currentItemIndice < $(this).attr('data-slide') ? -1 : 1);
					}
					self.currentItemIndice = self.getIndice($(this).attr('data-slide'));
					self.showItem();
				}
				return false;
			});
		},
		addThumbnail: function (indice, item) {
			var src = ((this.settings.thumbnailsDirectory.length > 0) ? this.settings.thumbnailsDirectory : item.folder) + item.filename + item.extension,
				thumbnail = $('<a/>', {
					href: '#',
					class: 'fsb-galery-thumbnail-item' + (indice == 0 ? ' active' : ''),
					'data-slide': indice
				}).html($('<img/>', {
					src: src,
					alt: item.description
				})).appendTo(this.thumbnailsContainer);
		},
		showPreviousItem: function (clickEvent) {
			if (this.locked !== true) {
				this.diaporama = false;
				this.currentItemIndice = this.getIndice(this.currentItemIndice - 1);
				if (this.settings.animation == 'slide') {
					this.direction = 1;
				}
				this.showItem();
			}
		},
		showNextItem: function (clickEvent) {
			if (this.locked !== true) {
				this.diaporama = false;
				this.currentItemIndice = this.getIndice(this.currentItemIndice + 1);
				if (this.settings.animation == 'slide') {
					this.direction = -1;
				}
				this.showItem();
			}
		},
		showItem: function () {
			var self = this,
				dataContainer = this.dataContainer,
				settings = this.settings,
				currentItemIndice = this.currentItemIndice;

			this.updateCounter();
			this.locked = true;
			switch (this.settings.animation) {
				case 'fade':
					var newItem = this.addItem(this.currentItemIndice, this.data[this.currentItemIndice]);
					$(dataContainer).find('.fsb-galery-data-item.active').fadeOut(settings.animationSpeed, function () {
						$(this).removeClass('active').remove();
						$(self.navigationContainer).find('.fsb-galery-navigation-item.active').removeClass('active');
						$(self.thumbnailsContainer).find('.fsb-galery-thumbnail-item.active').removeClass('active');
						$(self.navigationContainer).find('.fsb-galery-navigation-item').eq(currentItemIndice).addClass('active');
						$(self.thumbnailsContainer).find('.fsb-galery-thumbnail-item').eq(currentItemIndice).addClass('active');
						newItem.fadeIn(settings.animationSpeed, function () {
							$(this).addClass('active');
							self.locked = false;
							if (self.diaporama) {
								self.diaporamaTimeout = setTimeout(function () {
									self.showNextItem();
								}, self.settings.diaporamaPeriod);
							}
						});
					});
					break;
				case 'slide':
					var currentItem = $(dataContainer).find('.fsb-galery-data-item.active'),
						newItem = this.addItem(currentItemIndice, this.data[currentItemIndice])
							.css('left', -self.direction * currentItem.width())
							.css('position', 'absolute')
							.css('top', 0)
							.css('height', currentItem.height());

					currentItem.animate({
						left: self.direction * currentItem.width()
					}, settings.animationSpeed, settings.animationEasing, function () {
						$(this).removeClass('active').remove();
						$(self.navigationContainer).find('.fsb-galery-navigation-item.active').removeClass('active');
						$(self.thumbnailsContainer).find('.fsb-galery-thumbnail-item.active').removeClass('active');
						$(self.navigationContainer).find('.fsb-galery-navigation-item').eq(currentItemIndice).addClass('active');
						$(self.thumbnailsContainer).find('.fsb-galery-thumbnail-item').eq(currentItemIndice).addClass('active');						
					});
					newItem.addClass('active').animate({
						left: 0
					}, settings.animationSpeed, settings.animationEasing, function () {
						$(this).css('position', 'relative');
						self.locked = false;
						if (self.diaporama) {
							self.diaporamaTimeout = setTimeout(function () {
								self.showNextItem();
							}, self.settings.diaporamaPeriod);
						}
						
					});
					break;
				case 'crossfade':
					var self = this,
						currentItem = $(dataContainer).find('.fsb-galery-data-item.active').css('z-index', -1),
						newItem = this.addItem(this.currentItemIndice, this.data[this.currentItemIndice])
							.css('position', 'absolute')
							.css('top', 0);

					newItem.fadeIn(self.settings.animationSpeed, function () {
						$(this).css('position', 'relative').addClass('active');
						currentItem.remove();
						self.locked = false;
						if (self.diaporama) {
							self.diaporamaTimeout = setTimeout(function () {
								self.showNextItem();
							}, self.settings.diaporamaPeriod);
						}
					});
					break;
				default:
					console.log('Ooohooo sorry, I do not have programmed this animation yet !');
					break;
			}
			// Title and description
			var item = this.data[this.currentItemIndice],
				self = this;
			if (this.settings.showTitle) {
				this.titleContainer.fadeOut(this.settings.animationSpeed, function () {
					$(this).empty().html(item.filename).fadeIn(self.settings.animationSpeed);
				});
			}
			if (this.settings.showDescription) {
				this.descriptionContainer.fadeOut(this.settings.animationSpeed, function () {
					$(this).empty().html(item.description).fadeIn(self.settings.animationSpeed);
				})
			}
		},
		updateCounter: function () {
			if (this.settings.showControlsBar) {
				this.counter.currentItem.html(parseInt(this.currentItemIndice) + 1);
			}
		},
		getIndice: function (indice) {
			if (indice < 0) {
				indice += this.data.length;
			} else if (indice > (this.data.length - 1)) {
				indice = 0;
			}
			return indice;
		},
		destroy: function () {
			$(this.previousLink).off('click');
			$(this.nextLink).off('click');
			$(this.wrapper).remove();
		}
	}
	$.fn.FSBGalery = function (config) {
		var defaults = {
			// Data config
			fromJson: false,
			data: [],
			currentItemIndice: 0,
			// Animation config
			animation: 'fade',
			animationSpeed: 600,
			animationEasing: 'linear',
			// Controls config
			showControls: true,
			showControlsBar: true,
			// Navigation config
			showNavigation: true,
			// Thumbnails config
			showThumbnails: true,
			thumbnailsDirectory: '',
			// Diaporama config
			autoplay: false,
			diaporamaPeriod: 4000,
			counter: true,
			// Title and Description
			showTitle: true,
			showDescription: true
		}
		if (this.length) {
			return this.each ( function () {
				var Galery = Object.create(FSBGalery).init(this, $.extend(defaults, config));
			});
		}
	}
})(jQuery);