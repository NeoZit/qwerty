(() => {
    "use strict";
    function isWebp() {
        function testWebP(callback) {
            let webP = new Image;
            webP.onload = webP.onerror = function() {
                callback(2 == webP.height);
            };
            webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
        }
        testWebP((function(support) {
            let className = true === support ? "webp" : "no-webp";
            document.documentElement.classList.add(className);
        }));
    }
    let addWindowScrollEvent = false;
    setTimeout((() => {
        if (addWindowScrollEvent) {
            let windowScroll = new Event("windowScroll");
            window.addEventListener("scroll", (function(e) {
                document.dispatchEvent(windowScroll);
            }));
        }
    }), 0);
    const GalleryClassName = "gallery";
    const GalleryDraggableClassName = "gallery-draggable";
    const GalleryLineClassName = "gallery-line";
    const GalleryLineContainerClassName = "gallery-line-container";
    const GallerySlideClassName = "gallery-slide";
    const GalleryDotsClassName = "gallery-dots";
    const GalleryDotClassName = "gallery-dot";
    const GalleryDotActiveClassName = "gallery-dot-active";
    const GalleryNavClassName = "gallery-nav";
    const GalleryNavLeftClassName = "gallery-nav-left";
    const GalleryNavRightClassName = "gallery-nav-right";
    const GalleryNavDisabledClassName = "gallery-nav-disabled";
    class Gallery {
        constructor(element, options = {}) {
            this.containerNode = element;
            this.size = element.childElementCount;
            this.currentSlide = 0;
            this.currentSlideWasChanged = false;
            this.settings = {
                margin: options.margin || 0,
                dots: options.dots || false
            };
            this.manageHTML = this.manageHTML.bind(this);
            this.setParameters = this.setParameters.bind(this);
            this.setEvents = this.setEvents.bind(this);
            this.resizeGallery = this.resizeGallery.bind(this);
            this.startDrag = this.startDrag.bind(this);
            this.stopDrag = this.stopDrag.bind(this);
            this.dragging = this.dragging.bind(this);
            this.setStylePosition = this.setStylePosition.bind(this);
            this.clickDots = this.clickDots.bind(this);
            this.moveToLeft = this.moveToLeft.bind(this);
            this.moveToRight = this.moveToRight.bind(this);
            this.changeCurrentSlide = this.changeCurrentSlide.bind(this);
            this.changeActiveDotClass = this.changeActiveDotClass.bind(this);
            this.changeDisabledNav = this.changeDisabledNav.bind(this);
            this.manageHTML();
            this.setParameters();
            this.setEvents();
        }
        manageHTML() {
            this.containerNode.classList.add(GalleryClassName);
            this.containerNode.innerHTML = `\n            <div class="${GalleryLineContainerClassName}">\n                <div class="${GalleryLineClassName}">\n                    ${this.containerNode.innerHTML}\n                </div>\n            </div>\n            <div class="${GalleryNavClassName}">\n                <button class="${GalleryNavLeftClassName}">Left</button>\n                <button class="${GalleryNavRightClassName}">Right</button>\n            </div>\n            ${this.settings.dots ? '<div class="${GalleryDotsClassName}"></div>' : ""}\n        `;
            this.lineContainerNode = this.containerNode.querySelector(`.${GalleryLineContainerClassName}`);
            this.lineNode = this.containerNode.querySelector(`.${GalleryLineClassName}`);
            this.slideNodes = Array.from(this.lineNode.children).map((childNode => wrapElementByDiv({
                element: childNode,
                className: GallerySlideClassName
            })));
            if (this.settings.dots) {
                this.dotsNode = this.containerNode.querySelector(`.${GalleryDotsClassName}`);
                this.dotsNode.innerHTML = Array.from(Array(this.size).keys()).map((key => `<button class="${GalleryDotClassName} ${key === this.currentSlide ? GalleryDotActiveClassName : ""}"></button>`)).join("");
                this.dotNodes = this.dotsNode.querySelectorAll(`.${GalleryDotClassName}`);
            }
            this.navLeft = this.containerNode.querySelector(`.${GalleryNavLeftClassName}`);
            this.navRight = this.containerNode.querySelector(`.${GalleryNavRightClassName}`);
        }
        setParameters() {
            const coordsLineContainer = this.lineContainerNode.getBoundingClientRect();
            this.width = coordsLineContainer.width;
            this.maximumX = -(this.size - 1) * (this.width + this.settings.margin);
            this.x = -this.currentSlide * (this.width + this.settings.margin);
            this.resetStyleTransition();
            this.lineNode.style.width = `${this.size * (this.width + this.settings.margin)}px`;
            this.setStylePosition();
            if (this.settings.dots) this.changeActiveDotClass();
            this.changeDisabledNav();
            Array.from(this.slideNodes).forEach((slideNode => {
                slideNode.style.width = `${this.width}px`;
                slideNode.style.marginRight = `${this.settings.margin}px`;
            }));
        }
        setEvents() {
            this.debouncedResizeGallery = debounce(this.resizeGallery);
            window.addEventListener("resize", this.debouncedResizeGallery);
            this.lineNode.addEventListener("pointerdown", this.startDrag);
            window.addEventListener("pointerup", this.stopDrag);
            window.addEventListener("pointercancel", this.stopDrag);
            window.addEventListener("contextmenu", this.stopDrag);
            if (this.settings.dots) this.dotsNode.addEventListener("click", this.clickDots);
            this.navLeft.addEventListener("click", this.moveToLeft);
            this.navRight.addEventListener("click", this.moveToRight);
        }
        destroyEvents() {
            window.removeEventListener("resize", this.debouncedResizeGallery);
            this.lineNode.removeEventListener("pointerdown", this.startDrag);
            window.removeEventListener("pointerup", this.stopDrag);
            window.removeEventListener("pointercancel", this.stopDrag);
            window.removeEventListener("contextmenu", this.stopDrag);
            if (this.settings.dots) this.dotsNode.removeEventListener("click", this.clickDots);
            this.navLeft.removeEventListener("click", this.moveToLeft);
            this.navRight.removeEventListener("click", this.moveToRight);
        }
        resizeGallery() {
            this.setParameters();
        }
        startDrag(evt) {
            this.currentSlideWasChanged = false;
            this.clickX = evt.pageX;
            this.startX = this.x;
            this.resetStyleTransition();
            this.containerNode.classList.add(GalleryDraggableClassName);
            window.addEventListener("pointermove", this.dragging);
        }
        stopDrag() {
            window.removeEventListener("pointermove", this.dragging);
            this.containerNode.classList.remove(GalleryDraggableClassName);
            this.changeCurrentSlide();
        }
        dragging(evt) {
            this.dragX = evt.pageX;
            const dragShift = this.dragX - this.clickX;
            const easing = dragShift / 5;
            this.x = Math.max(Math.min(this.startX + dragShift, easing), this.maximumX + easing);
            this.setStylePosition();
            if (dragShift > 20 && dragShift > 0 && !this.currentSlideWasChanged && this.currentSlide > 0) {
                this.currentSlideWasChanged = true;
                this.currentSlide = this.currentSlide - 1;
            }
            if (dragShift < -20 && dragShift < 0 && !this.currentSlideWasChanged && this.currentSlide < this.size - 1) {
                this.currentSlideWasChanged = true;
                this.currentSlide = this.currentSlide + 1;
            }
        }
        clickDots(evt) {
            const dotNode = evt.target.closest("button");
            if (!dotNode) return;
            let dotNumber;
            for (let i = 0; i < this.dotNodes.length; i++) if (this.dotNodes[i] === dotNode) {
                dotNumber = i;
                break;
            }
            if (dotNumber === this.currentSlide) return;
            const countSwipes = Math.abs(this.currentSlide - dotNumber);
            this.currentSlide = dotNumber;
            this.changeCurrentSlide(countSwipes);
        }
        moveToLeft() {
            if (this.currentSlide <= 0) return;
            this.currentSlide = this.currentSlide - 1;
            this.changeCurrentSlide();
        }
        moveToRight() {
            if (this.currentSlide >= this.size - 1) return;
            this.currentSlide = this.currentSlide + 1;
            this.changeCurrentSlide();
        }
        changeCurrentSlide(countSwipes) {
            this.x = -this.currentSlide * (this.width + this.settings.margin);
            this.setStyleTransition(countSwipes);
            this.setStylePosition();
            if (this.settings.dots) this.changeActiveDotClass();
            this.changeDisabledNav();
        }
        changeActiveDotClass() {
            for (let i = 0; i < this.dotNodes.length; i++) this.dotNodes[i].classList.remove(GalleryDotActiveClassName);
            this.dotNodes[this.currentSlide].classList.add(GalleryDotActiveClassName);
        }
        changeDisabledNav() {
            if (this.currentSlide <= 0) this.navLeft.classList.add(GalleryNavDisabledClassName); else this.navLeft.classList.remove(GalleryNavDisabledClassName);
            if (this.currentSlide >= this.size - 1) this.navRight.classList.add(GalleryNavDisabledClassName); else this.navRight.classList.remove(GalleryNavDisabledClassName);
        }
        setStylePosition() {
            this.lineNode.style.transform = `translate3d(${this.x}px, 0, 0)`;
        }
        setStyleTransition(countSwipes = 1) {
            this.lineNode.style.transition = `all ${.25 * countSwipes}s ease 0s`;
        }
        resetStyleTransition() {
            this.lineNode.style.transition = `all 0s ease 0s`;
        }
    }
    function wrapElementByDiv({element, className}) {
        const wrapperNode = document.createElement("div");
        wrapperNode.classList.add(className);
        element.parentNode.insertBefore(wrapperNode, element);
        wrapperNode.appendChild(element);
        return wrapperNode;
    }
    function debounce(func, time = 100) {
        let timer;
        return function(event) {
            clearTimeout(timer);
            timer = setTimeout(func, time, event);
        };
    }
    new Gallery(document.getElementById("gallery"), {
        margin: 10,
        dots: false
    });
    const BODY_BURGER_OPENED = "body_burger-opened";
    const bodyNode = document.querySelector("body");
    const htmlNode = document.querySelector("html");
    const burgerControlNode = document.querySelector(".burger-menu__control");
    const burgerSpaceCoverNode = document.querySelector(".cover-space__burger");
    burgerControlNode.addEventListener("click", (_event => {
        if (bodyNode.classList.contains(BODY_BURGER_OPENED)) {
            bodyNode.classList.remove(BODY_BURGER_OPENED);
            htmlNode.classList.remove("lock");
        } else {
            bodyNode.classList.add(BODY_BURGER_OPENED);
            htmlNode.classList.add("lock");
        }
    }));
    burgerSpaceCoverNode.addEventListener("click", (_event => {
        bodyNode.classList.remove(BODY_BURGER_OPENED);
        htmlNode.classList.remove("lock");
    }));
    const HEADER_SCROLLED_CLASS = "header_scrolled";
    const headerNode = document.querySelector(".header");
    window.addEventListener("scroll", toggleBgHeader);
    function toggleBgHeader() {
        if (window.scrollY >= 20 && !headerNode.classList.contains(HEADER_SCROLLED_CLASS)) headerNode.classList.add(HEADER_SCROLLED_CLASS); else if (window.scrollY < 20 && headerNode.classList.contains(HEADER_SCROLLED_CLASS)) headerNode.classList.remove(HEADER_SCROLLED_CLASS);
    }
    const scrollDownButton = document.querySelector("#scroll-action");
    const scrollToNode = document.querySelector("#scroll-to");
    let currentScroll = window.scrollY;
    let scrollAnimationId;
    scrollDownButton.addEventListener("click", (() => {
        stopAnimationScroll();
        currentScroll = window.scrollY;
        startAnimationScroll(scrollToNode.offsetTop - 80);
    }));
    function startAnimationScroll(newScrollY) {
        const deltaScroll = newScrollY - currentScroll;
        currentScroll += .08 * deltaScroll;
        window.scrollTo(0, currentScroll);
        if (Math.abs(deltaScroll) > 1) scrollAnimationId = window.requestAnimationFrame((() => startAnimationScroll(newScrollY))); else {
            window.scrollTo(0, newScrollY);
            stopAnimationScroll();
        }
    }
    function stopAnimationScroll() {
        window.cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = void 0;
    }
    window["FLS"] = true;
    isWebp();
})();