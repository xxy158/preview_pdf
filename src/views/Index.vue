<template>
  <div class="pdf-container">
    <div class="uploadFile">
      <h2>选择pdf文件</h2>
      <input class="pdfFile" type="file" accept=".pdf" @change="fileChange($event)">
    </div>
    <div class="pdfContainer">
      <div class="pdfOprate">
        <!-- 当前页码/页码总数 -->
        <span class="pdfCount"><input type="text" class="pageInput" v-model="pageNum" @input="numInput()" @change="numChange()"> / <span class="pdfPageTotal">{{totalPage}}</span></span>
        <span class="splitLine"></span>
        <!-- 缩小pdf视图 -->
        <span class="btnwidth smallBtn" @click="toggleWidth(0)">-</span>
        <!-- 当前缩放百分比 -->
        <span class="scaleBigger">100%</span>
        <!-- 放大pdf视图 -->
        <span class="btnwidth bigBtn" style="margin-left: 5px;" @click="toggleWidth(1)">+</span>
      </div>
      <!-- pdf视图 -->
      <div class="pdfBody" @mousedown="pdfDown($event)" @scroll="pdfScroll($event)">
        <div id="pdfBox">
          <!-- <div class="divBox">
            <canvas ></canvas>
            <div class="textLayer"></div>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import PDFJS from "pdfjs-dist";
// 文本视图，可复制
import { TextLayerBuilder } from "pdfjs-dist/web/pdf_viewer";
import "pdfjs-dist/web/pdf_viewer.css";
PDFJS.workerSrc = require("pdfjs-dist/build/pdf.worker.min");
export default {
  data() {
    return {
      scrollHeight: [0], // 每页高度
      scrollHalfHeight: [0], // 滚动时页码判断的高度
      heightAll: 0, // 当前累计的高度
      viewPdfObject: {}, // 预览pdf解析出的pdf信息对象
      viewLoadMap: {}, // 预览pdf已加载的页
      hasChange: false, // 缩放比例 之前的缩放是否完成
      zoom: 1, // 缩放比例
      loadingPage: "", // 等待loading
      viewPageMaxWidth: 0, // 预览pdf的渲染页中最大宽度
      breakOff: false, // 是否中断预览pdf的后续页渲染
      pageNum: 0,
      oldPageNum: 0,
      totalPage: 0,
    };
  },
  created() {},
  methods: {
    // 上传pdf文件
    fileChange(e) {
      var file = e.target.files[0];
      console.log(file)
      if (file) {
        // 使用pdf.js加载和显示PDF文件
        this.previewPdf(file);
      }
    },
    numInput() {
      this.pageNum = this.pageNum.replace(/\D/g, "");
    },
    numChange() {
      if (this.pageNum < 1 || this.pageNum > this.totalPage) {
        this.pageNum = this.oldPageNum;
        return;
      }
      this.oldPageNum = this.pageNum;
      var dom = $(".divBox").eq(this.pageNum - 1)[0];
      if (dom) {
        dom.scrollIntoView();
      } else {
        this.$message.warning("此页还未加载，请稍等...");
      }
    },
    sleep(time) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(time);
        }, time);
      });
    },
    // 预览pdf将值重置
    clearPdfData() {
      this.breakOff = false; // 是否中断预览pdf的后续页渲染
      $("#pdfBox").html("");
      this.viewLoadMap = {}; // 预览pdf已加载的页
      this.viewPdfObject = {}; // 预览pdf解析出的pdf信息对象
      this.scrollHeight = [0]; // 每页高度
      this.scrollHalfHeight = [0]; // 滚动时页码判断的高度
      this.heightAll = 0; // 当前累计的高度
      this.viewPageMaxWidth = 0;
    },
    // 使用pdf.js加载和显示PDF文件
    previewPdf(file) {
      var that = this;
      // 预览pdf将值重置
      this.clearPdfData();
      this.loadingPage = this.$loading({
        lock: true,
        text: "加载中...",
        background: "rgba(0,0,0,0.7)",
        spinner: "el-icon-loading",
      });
      this.showPdf = true;
      PDFJS.useOnlyCssZoom = true;
      PDFJS.maxCanvasPixels = 4000000;
      const documentFragment = document.createDocumentFragment();
      const fileReader = new FileReader();
      fileReader.onload = function () {
        const typedArray = new Uint8Array(this.result);
        // 调用pdf.js的API加载PDF文件
        console.time();
        PDFJS.getDocument(typedArray).promise.then(async function (pdf) {
          that.viewPdfObject = pdf;
          // 获取PDF的总页数
          const numPages = pdf.numPages;
          that.pageNum = 1;
          that.oldPageNum = 1;
          that.totalPage = numPages;
          console.log(pdf);
          // // 依次渲染每一页的内容，最多渲染50页
          // that.pageView(pdf,1,numPages,documentFragment,50)

          const pdfBox = document.getElementById("pdfBox");
          // 循环绘制每个页面
          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            if (that.breakOff) {
              break;
            }
            if (pageNum % 10 == 1) {
              documentFragment.innerHTML = "";
            }
            let page = await pdf.getPage(pageNum);
            //   console.log($(".pdfBody").width()*0.65/page.view[2])
            const viewport = page.getViewport(
              ($(".pdfBody").width() * 0.65) / page.view[2]
            );
            // 获取渲染pdf中宽度最大值
            if (that.viewPageMaxWidth < viewport.width) {
              that.viewPageMaxWidth = viewport.width;
            }
            const divBox = document.createElement("div");
            divBox.className = "divBox";
            documentFragment.appendChild(divBox);
            const canvasElement = document.createElement("canvas");
            const context = canvasElement.getContext("2d");
            canvasElement.width = viewport.width;
            canvasElement.height = viewport.height;
            // context.scale(0.5,0.5)
            // canvasElement.style.width = viewport.width*0.5+"px";
            // canvasElement.style.height = viewport.height*0.5+"px";
            // 清除canvas内容
            context.clearRect(0, 0, canvasElement.width, canvasElement.height);
            divBox.appendChild(canvasElement);

            // 渲染指定页的内容到canvas上
            // 如果你只是展示pdf而不需要复制pdf内容功能，则可以这样写render
            // page.render({canvasContext: context,viewport}) 如果你需要复制则像下面那样写利用text-layer
            var textContent = await page
              .render({
                canvasContext: context,
                viewport,
              })
              .then(() => {
                return page.getTextContent();
              });
            console.log(JSON.parse(JSON.stringify(textContent.items)));
            var newTexts = [];
            var textItem = {},
              str = "",
              pos = [],
              width = 0,
              leiWidth = 0,
              notLei,
              widthMore;
            textContent.items.forEach((item, index) => {
              if (
                item.transform[0] == pos[0] &&
                item.transform[1] == pos[1] &&
                item.transform[2] == pos[2] &&
                item.transform[3] == pos[3] &&
                item.transform[5] == pos[5] &&
                item.transform[4] - 3 <= leiWidth &&
                item.transform[4] + 3 >= leiWidth &&
                !/^\s+$/g.test(item.str) &&
                !notLei
              ) {
                var chaWidth =
                  item.transform[4] -
                  (textContent.items[index - 1].transform[4] +
                    textContent.items[index - 1].width);
                str += item.str;
                width += item.width + chaWidth;
                leiWidth = item.transform[4] + item.width;
                if (-1 <= chaWidth && chaWidth <= 1) {
                  widthMore = true;
                }
              } else {
                if (JSON.stringify(textItem) != "{}") {
                  if (widthMore) {
                    width += 0.8;
                    widthMore = false;
                  }
                  textItem.str = str;
                  textItem.width = width;
                  newTexts.push(textItem);
                }
                if (index == textContent.items.length - 1) {
                  newTexts.push(item);
                }
                if (notLei) {
                  notLei = false;
                }
                if (/^\s+$/g.test(item.str)) {
                  notLei = true;
                }
                textItem = JSON.parse(JSON.stringify(item));
                str = item.str;
                pos = JSON.parse(JSON.stringify(item.transform));
                width = item.width;
                leiWidth = item.transform[4] + item.width;
              }
            });
            console.log(newTexts);
            textContent.items = newTexts;
            // 创建文本图层div
            const textLayerDiv = document.createElement("div");
            textLayerDiv.className = "textLayer";
            textLayerDiv.setAttribute("class", "textLayer");
            textLayerDiv.setAttribute(
              "style",
              "margin:auto;" +
                "width:" +
                viewport.width +
                "px;" +
                "height:" +
                viewport.height +
                "px"
            );
            // 将文本图层div添加至每页pdf的div中
            divBox.appendChild(textLayerDiv);
            if (pageNum == numPages || pageNum % 10 == 0) {
              pdfBox.appendChild(documentFragment);
            }
            // pdfBox.appendChild(divBox)
            // 创建新的TextLayerBuilder实例
            let textLayer = new TextLayerBuilder({
              textLayerDiv: textLayerDiv,
              pageIndex: page.pageIndex,
              viewport: viewport,
            });
            textLayer.setTextContent(textContent);
            textLayer.render();
            // 保存当前页的高度
            that.heightAll += canvasElement.height * 0.7;
            that.scrollHalfHeight.push(that.heightAll);
            that.heightAll += canvasElement.height * 0.3;
            that.scrollHeight.push(that.heightAll);
            pdfBox.style.width = that.viewPageMaxWidth + "px";
            if (
              (pageNum < 10 && pageNum == numPages) ||
              (pageNum >= 10 && pageNum == 10)
            ) {
              that.loadingPage.close();
              // that.loadingPage=""
            }
            if (pageNum == numPages) {
              console.timeEnd();
            }
            // 创建一个 延时队列的任务 主进程会执行渲染队列任务后在执行延时队列任务等待延时，后再创建 渲染pdf下一页的微任务。反复如此执行
            // await that.sleep(100)
            // 当是新标签页面时，离开当前标签页浏览器会将非激活标签页的 JavaScript 执行降至最低，以节省系统资源
          }
        });
      };
      fileReader.readAsArrayBuffer(file);
    },
    // 递归渲染pdf每一页的内容
    pageView(pdf, pageNumber, numPages, documentFragment, endPage) {
      var that = this;
      const pdfBox = document.getElementById("pdfBox");
      pdf.getPage(pageNumber).then(function (page) {
        console.log(page);
        const viewport = page.getViewport(
          ($(".pdfBody").width() * 0.6) / page.view[2]
        );
        if (that.viewPageMaxWidth < viewport.width) {
          that.viewPageMaxWidth = viewport.width;
        }
        const divBox = document.createElement("div");
        divBox.className = "divBox";
        documentFragment.appendChild(divBox);
        const canvasElement = document.createElement("canvas");
        const context = canvasElement.getContext("2d");
        canvasElement.width = viewport.width;
        canvasElement.height = viewport.height;
        // 清除canvas内容
        context.clearRect(0, 0, canvasElement.width, canvasElement.height);
        console.log(
          pageNumber,
          canvasElement.width,
          canvasElement.height,
          viewport
        );
        // 渲染指定页的内容到canvas上
        // 如果你只是展示pdf而不需要复制pdf内容功能，则可以这样写render
        // page.render({canvasContext: context,viewport}) 如果你需要复制则像下面那样写利用text-layer
        page
          .render({
            canvasContext: context,
            viewport,
          })
          .then(() => {
            return page.getTextContent();
          })
          .then(async (textContent) => {
            divBox.appendChild(canvasElement);
            // 创建文本图层div
            const textLayerDiv = document.createElement("div");
            textLayerDiv.className = "textLayer";
            textLayerDiv.setAttribute("class", "textLayer");
            textLayerDiv.setAttribute(
              "style",
              "margin:auto;" +
                "width:" +
                viewport.width +
                "px;" +
                "height:" +
                viewport.height +
                "px"
            );
            // 将文本图层div添加至每页pdf的div中
            divBox.appendChild(textLayerDiv);
            // 创建新的TextLayerBuilder实例
            let textLayer = new TextLayerBuilder({
              textLayerDiv: textLayerDiv,
              pageIndex: page.pageIndex,
              viewport: viewport,
            });
            textLayer.setTextContent(textContent);
            textLayer.render();
            // 渲染下一页
            that.heightAll += canvasElement.height * 0.7;
            that.scrollHalfHeight.push(that.heightAll);
            that.heightAll += canvasElement.height * 0.3;
            that.scrollHeight.push(that.heightAll);
            that.viewLoadMap[pageNumber] = 1;
            // 最多渲染50页
            if (
              (numPages > endPage && pageNumber < endPage) ||
              (numPages <= endPage && pageNumber < numPages)
            ) {
              that.pageView(
                pdf,
                pageNumber + 1,
                numPages,
                documentFragment,
                endPage
              );
            } else {
              console.log(pdfBox, that.viewLoadMap);
              pdfBox.style.width = that.viewPageMaxWidth + "px";
              pdfBox.appendChild(documentFragment);
              that.loadingPage.close();
              that.loadingPage = "";
            }
            // 下一页 渲染 前创建 延时队列任务
            await that.sleep(100);
          });
      });
    },
    // 拖动pdf视图
    pdfDown(e) {
      var pdfBody = document.querySelector(".pdfBody");
      console.log(e);
      var isdrag = true;
      var dragBegin = {
        x: e.clientX,
        y: e.clientY,
        scrollTop: pdfBody.scrollTop,
        scrollLeft: pdfBody.scrollLeft,
      };
      document.body.onmousemove = function (e) {
        var event = e || window.event;
        if (isdrag) {
          pdfBody.scrollTo(
            dragBegin.scrollLeft + dragBegin.x - event.clientX,
            dragBegin.scrollTop + dragBegin.y - event.clientY
          );
        }
      };
      document.body.onmouseup = function (e) {
        isdrag = false;
        document.body.onmousemove = null;
        document.body.onmousemove = null;
      };
    },
    // 放大缩小pdf视图
    toggleWidth(type) {
      //放大缩小pdf展示区
      if (this.hasChange) {
        return;
      }
      var pdfBox = document.getElementById("pdfBox");
      var beginWidth = pdfBox.clientWidth;
      // 缩小
      if (type == 0) {
        this.zoom = this.zoom > 1 ? this.zoom - 0.1 : 1;
      } else {
        // 放大
        this.zoom = this.zoom < 2 ? this.zoom + 0.1 : 2;
      }
      this.hasChange = true;
      var zommWidth = beginWidth * this.zoom;
      var translateX = -(zommWidth - beginWidth) / 2;
      console.log(translateX);
      // 当元素左侧可视区域超出盒子边缘，需要将pdf视图移动到初始可视位置距离左侧的距离，即刚加载时视图最右居中的初始位置
      var endX =
        (document.querySelector(".pdfBody").clientWidth - beginWidth) / 2;
      if (Math.abs(translateX) >= endX) {
        translateX = -endX;
      }
      $("#pdfBox").css(
        "transform",
        "translateX(" + translateX + "px) scale(" + this.zoom + ")"
      );
      setTimeout(() => {
        $(".scaleBigger").html(parseInt(this.zoom * 100) + "%");
        this.getPdfScrollHeight();
      }, 50);
    },
    // pdf每页的高度累加值，以及每页滚动的临界值
    getPdfScrollHeight() {
      var that = this;
      this.scrollHeight = [0];
      this.scrollHalfHeight = [0];
      this.heightAll = 0;
      $(".pdfBody canvas").each(function (i) {
        that.heightAll += this.height * that.zoom * 0.7;
        that.scrollHalfHeight.push(that.heightAll);
        that.heightAll += this.height * that.zoom * 0.3;
        that.scrollHeight.push(that.heightAll);
      });
      this.hasChange = false;
      console.log(that.scrollHalfHeight, that.scrollHeight);
    },
    // 滚动pdf时，同时更新当前页码
    pdfScroll(e) {
      var pdfBody = document.querySelector(".pdfBody");
      for (let i = 0; i < this.scrollHeight.length; i++) {
        if (
          pdfBody.scrollTop >= this.scrollHeight[i] &&
          pdfBody.scrollTop < this.scrollHeight[i + 1]
        ) {
          // console.log(i)
          if (this.pageNum != i + 1) {
            this.pageNum = i + 1;
            this.oldPageNum = this.pageNum;
          }
        }
      }
      // 滚动到底部时，加载未加载的页面
      // if(pdfBody.scrollTop+pdfBody.clientHeight*1.1>=pdfBody.scrollHeight){
      //   var loadPages=Object.keys(this.viewLoadMap)
      //   if(this.loadingPage||loadPages.length==this.viewPdfObject.numPages){
      //     return
      //   }
      //   this.loadingPage=this.$loading({
      //     lock:true,
      //     text:"加载中...",
      //     background:"rgba(0,0,0,0.7)",
      //     spinner:"el-icon-loading"
      //   })
      //   console.log(123)
      //   const documentFragment = document.createDocumentFragment();
      //   var beginPage=Number(loadPages[loadPages.length-1])+1
      //   var endPage=Number(loadPages[loadPages.length-1])+50
      //   console.log(this.viewPdfObject,beginPage,numPages,documentFragment,endPage)
      //   // 获取PDF的总页数
      //   var numPages=this.viewPdfObject.numPages
      //   // 依次渲染每一页的内容
      //   this.pageView(this.viewPdfObject,beginPage,numPages,documentFragment,endPage)
      // }
    },
  },
};
</script>

<style scoped>
.pdf-container {
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  /* padding: 0 20px; */
  background: rgba(0, 0, 0, 0.7);
}
.uploadFile{
  display: flex;
  align-items: center;
  color: #fff;
}
.pdfFile {
  margin-left: 20px;
}
.pdfContainer {
  width: 100%;
  height: calc(100% - 38px);
  display: flex;
  flex-direction: column;
  position: absolute;
}
.pdfOprate {
  position: absolute;
  background: rgba(0, 0, 0, 0.4);
  width: 100%;
  text-align: center;
  font-size: 35px;
  height: 60px;
  line-height: 45px;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  -ms-touch-select: none;
  vertical-align: middle;
  color: #f8f8f8;
  z-index: 10;
}
.pdfOprate .btnwidth {
  cursor: pointer;
  height: 24px;
  line-height: 24px;
  display: inline-block;
  vertical-align: middle;
}
.btnwidth.smallBtn {
  height: 20px;
  line-height: 20px;
  margin-right: 5px;
}
.pdfBody {
  width: 100%;
  height: calc(100% - 60px);
  margin-top: 60px;
  overflow: auto;
}
#pdfBox {
  width: 100%;
  transform-origin: 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
}
.pdfCount,
.scaleBigger {
  font-size: 25px;
}
.splitLine {
  display: inline-block;
  height: 18px;
  width: 2px; /*no*/
  background: #fff;
  margin: 0 10px;
}
.pageInput {
  height: 35px;
  line-height: 35px;
  width: 55px;
  padding: 0 5px;
  font-size: 25px;
  border: none;
  border-radius: 4px;
}
input:focus {
  outline: none;
}
</style>
<style>
.divBox {
  position: relative;
}
.textLayer {
  position: absolute;
  bottom: initial;
}
</style>
