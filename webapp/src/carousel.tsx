import * as React from "react";

export interface ICarouselProps extends React.Props<Carousel> {

}

export interface ICarouselState {

}

const ANIMATION_MOVE_DIST = 5;
const ANIMATION_DEBUFF_DIST = 6;
const OUT_OF_BOUND_MARGIN = 20;

export class Carousel extends React.Component<ICarouselProps, ICarouselState> {
    private dragSurface: HTMLDivElement;
    private container: HTMLDivElement;
    private isDragging = false;
    private definitelyDragging = false;

    private childWidth: number;

    private currentOffset = 0;
    private targetOffset = 0;
    private index = 0;

    private dragStartX: number;
    private dragStartOffset: number;
    private dragOffset: number;

    private animationId: number;
    private childrenElements: HTMLDivElement[] = [];

    public render() {
        this.childrenElements = [];
        return <div className="ui grid">
            <div className="one wide column">
                <i className="arrow right"/>
            </div>
            <div className="twelve wide column carouselcontainer" ref={r => this.container = r}>
                <div className="carouselbody" ref={r => this.dragSurface = r}>
                {
                    React.Children.map(this.props.children, child => <div className="carouselitem" ref={r => this.childrenElements.push(r)}>
                        {child}
                    </div>)
                }
                </div>
            </div>
            <div className="one wide column">
                <i className="arrow right"/>
            </div>
        </div>
    }

    public componentDidMount() {
        this.initDragSurface();
    }

    public componentDidUpdate() {
        if (this.childrenElements.length) {
            this.childWidth = this.childrenElements[0].getBoundingClientRect().width;
        }
        this.dragSurface.style.width = this.totalLength() + "px";
    }

    private initDragSurface() {
        this.dragSurface.addEventListener("click", event => {
            if (this.definitelyDragging) {
                event.stopPropagation();
                event.preventDefault();
                this.definitelyDragging = false;
            }
        });

        this.dragSurface.addEventListener("mousedown", event => {
            event.preventDefault();
            this.dragStart(event.screenX);
        });

        this.dragSurface.addEventListener("mouseup", event => {
            if (this.isDragging) {
                this.dragEnd();
                if (this.definitelyDragging) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        });

        this.dragSurface.addEventListener("mouseleave", event => {
            if (this.isDragging) {
                this.dragEnd();
            }
        });

        this.dragSurface.addEventListener("mousemove", event => {
            if (this.isDragging) {
                this.definitelyDragging = true;
                event.stopPropagation();
                event.preventDefault();
                this.dragMove(event.screenX);

            }
        });
    }

    private dragStart(startX: number) {
        this.isDragging = true;
        this.dragStartX = startX;
        this.dragStartOffset = this.currentOffset;
        if (this.animationId) {
            window.cancelAnimationFrame(this.animationId);
        }
    }

    private dragEnd() {
        this.isDragging = false;
        this.updateIndex();
    }

    private dragMove(x: number) {
        this.dragOffset = x - this.dragStartX;
        const newOffset = this.dragStartOffset + this.dragOffset;

        this.setPosition(newOffset);
    }

    private setPosition(offset: number) {
        if (this.dragSurface) {
            offset = Math.max(Math.min(offset, OUT_OF_BOUND_MARGIN), -1 * (this.totalLength() + OUT_OF_BOUND_MARGIN));
            this.currentOffset = offset;
            this.dragSurface.style.marginLeft = offset + "px";
        }
    }

    private updateIndex() {
        if (this.dragSurface) {
            const bucketIndex = Math.abs(Math.floor(this.currentOffset / this.childWidth));

            if (this.currentOffset < this.dragStartOffset) {
                this.index = bucketIndex;
            }
            else {
                this.index = bucketIndex - 1;
            }

            this.targetOffset = this.indexToOffset(this.index);
            this.animationId = window.requestAnimationFrame(this.easeTowardsIndex.bind(this));
        }
    }

    private easeTowardsIndex() {
        if (this.dragSurface) {
            const diff = this.targetOffset - this.currentOffset;
            if (Math.abs(diff) < ANIMATION_DEBUFF_DIST) {
                this.setPosition(this.targetOffset);
            }
            else {
                if (diff > 0) {
                    this.setPosition(this.currentOffset + ANIMATION_MOVE_DIST);
                }
                else {
                    this.setPosition(this.currentOffset - ANIMATION_MOVE_DIST);
                }

                this.animationId = window.requestAnimationFrame(this.easeTowardsIndex.bind(this));
            }
        }
    }

    private indexToOffset(index: number) {
        return -1 * index * (this.childWidth);
    }

    private totalLength() {
        return React.Children.count(this.props.children) *
            (this.childWidth);
    }
}