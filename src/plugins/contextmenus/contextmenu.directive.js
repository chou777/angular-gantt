(function() {
    'use strict';
    angular.module('gantt.contextmenus').directive('ganttContextMenu', ['$log','$timeout', '$compile', '$document', '$templateCache', 'ganttDebounce', 'ganttSmartEvent', function($log, $timeout, $compile, $document, $templateCache, debounce, smartEvent) {
        // This contextmenu displays more information about a task

        return {
            restrict: 'E',
            templateUrl: function(tElement, tAttrs) {
                var templateUrl;
                if (tAttrs.templateUrl === undefined) {
                    templateUrl = 'plugins/contextmenus/contextmenu.tmpl.html';
                } else {
                    templateUrl = tAttrs.templateUrl;
                }
                if (tAttrs.template !== undefined) {
                    $templateCache.put(templateUrl, tAttrs.template);
                }
                return templateUrl;
            },
            scope: true,
            replace: true,
            controller: ['$scope', '$element', 'ganttUtils', function($scope, $element, utils) {
                var bodyElement = angular.element($document[0].body);
                var parentElement = $scope.task.$element;
                var showContextMenuPromise;
                var visible = false;
                var mouseEnterX;

                $scope.getFromLabel = function() {
                    var taskContextMenus = $scope.task.model.contextmenus;
                    var rowContextMenus = $scope.task.row.model.contextmenus;

                    if (typeof(taskContextMenus) === 'boolean') {
                        taskContextMenus = {enabled: taskContextMenus};
                    }

                    if (typeof(rowContextMenus) === 'boolean') {
                        rowContextMenus = {enabled: rowContextMenus};
                    }

                    var dateFormat = utils.firstProperty([taskContextMenus, rowContextMenus], 'dateFormat', $scope.pluginScope.dateFormat);
                    return $scope.task.model.from.format(dateFormat);
                };

                $scope.getToLabel = function() {
                    var taskContextMenus = $scope.task.model.contextmenus;
                    var rowContextMenus = $scope.task.row.model.contextmenus;

                    if (typeof(taskContextMenus) === 'boolean') {
                        taskContextMenus = {enabled: taskContextMenus};
                    }

                    if (typeof(rowContextMenus) === 'boolean') {
                        rowContextMenus = {enabled: rowContextMenus};
                    }

                    var dateFormat = utils.firstProperty([taskContextMenus, rowContextMenus], 'dateFormat', $scope.pluginScope.dateFormat);
                    return $scope.task.model.to.format(dateFormat);
                };

                var mouseMoveHandler = smartEvent($scope, bodyElement, 'mousemove', debounce(function(e) {
                    if (!visible) {
                        mouseEnterX = e.clientX;
                        displayContextMenu(true, false);
                    } else {
                        // check if mouse goes outside the parent
                        if(
                            !$scope.taskRect ||
                            e.clientX < $scope.taskRect.left ||
                            e.clientX > $scope.taskRect.right ||
                            e.clientY > $scope.taskRect.bottom ||
                            e.clientY < $scope.taskRect.top
                        ) {
                            displayContextMenu(false, false);
                        }

                        updateContextMenu(e.clientX);
                    }
                }, 5, false));


                $scope.task.getContentElement().bind('mousemove', function(evt) {
                    mouseEnterX = evt.clientX;
                });

                $scope.task.getContentElement().bind('mouseenter', function(evt) {
                    mouseEnterX = evt.clientX;
                    displayContextMenu(true, true);
                });

                $scope.task.getContentElement().bind('mouseleave', function() {
                    displayContextMenu(false);
                });

                if ($scope.pluginScope.api.tasks.on.moveBegin) {
                    $scope.pluginScope.api.tasks.on.moveBegin($scope, function(task) {
                        if (task === $scope.task) {
                            displayContextMenu(true);
                        }
                    });

                    $scope.pluginScope.api.tasks.on.moveEnd($scope, function(task) {
                        if (task === $scope.task) {
                            displayContextMenu(false);
                        }
                    });

                    $scope.pluginScope.api.tasks.on.resizeBegin($scope, function(task) {
                        if (task === $scope.task) {
                            displayContextMenu(true);
                        }
                    });

                    $scope.pluginScope.api.tasks.on.resizeEnd($scope, function(task) {
                        if (task === $scope.task) {
                            displayContextMenu(false);
                        }
                    });
                }

                var displayContextMenu = function(newValue, showDelayed) {
                    if (showContextMenuPromise) {
                        $timeout.cancel(showContextMenuPromise);
                    }

                    var taskContextMenus = $scope.task.model.contextmenus;
                    var rowContextMenus = $scope.task.row.model.contextmenus;

                    if (typeof(taskContextMenus) === 'boolean') {
                        taskContextMenus = {enabled: taskContextMenus};
                    }

                    if (typeof(rowContextMenus) === 'boolean') {
                        rowContextMenus = {enabled: rowContextMenus};
                    }

                    var enabled = utils.firstProperty([taskContextMenus, rowContextMenus], 'enabled', $scope.pluginScope.enabled);
                    if (enabled && !visible && mouseEnterX !== undefined && newValue) {
                        if (showDelayed) {
                            showContextMenuPromise = $timeout(function() {
                                showContextMenu(mouseEnterX);
                            }, $scope.pluginScope.delay, false);
                        } else {
                            showContextMenu(mouseEnterX);
                        }
                    } else if (!newValue) {
                        if (!$scope.task.active) {
                            hideContextMenu();
                        }
                    }
                };

                var showContextMenu = function(x) {
                    visible = true;
                    mouseMoveHandler.bind();

                    $scope.displayed = true;

                    $scope.$evalAsync(function() {
                        var restoreNgHide;
                        if ($element.hasClass('ng-hide')) {
                            $element.removeClass('ng-hide');
                            restoreNgHide = true;
                        }
                        $scope.elementHeight = $element[0].offsetHeight;
                        if (restoreNgHide) {
                            $element.addClass('ng-hide');
                        }
                        $scope.taskRect = parentElement[0].getBoundingClientRect();
                        updateContextMenu(x);
                    });
                };

                var getViewPortWidth = function() {
                    var d = $document[0];
                    return d.documentElement.clientWidth || d.documentElement.getElementById('body')[0].clientWidth;
                };

                var updateContextMenu = function(x) {
                    // Check if info is overlapping with view port
                    if (x + $element[0].offsetWidth > getViewPortWidth()) {
                        $element.css('left', (x + 20 - $element[0].offsetWidth) + 'px');
                        $scope.isRightAligned = true;
                    } else {
                        $element.css('left', (x - 20) + 'px');
                        $scope.isRightAligned = false;
                    }
                };

                var hideContextMenu = function() {
                    visible = false;
                    mouseMoveHandler.unbind();
                    $scope.$evalAsync(function() {
                        $scope.displayed = false;
                    });
                };

                if ($scope.task.isMoving) {
                    // Display contextmenu because task has been moved to a new row
                    displayContextMenu(true, false);
                }

                $scope.gantt.api.directives.raise.new('ganttContextMenu', $scope, $element);
                $scope.$on('$destroy', function() {
                    $scope.gantt.api.directives.raise.destroy('ganttContextMenu', $scope, $element);
                });
            }]
        };
    }]);
}());

