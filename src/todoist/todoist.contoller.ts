import { Controller, Post, Body, Get, UseGuards, Res, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { TodoistService } from './todoist.service';

@Controller('todo')
export class TodoistController {
  constructor(private readonly todoistService: TodoistService) { }

  @Get('todoist')
  @UseGuards(AuthGuard('todoist'))
  async loginWithTodoist(@Res() res: Response) {
    res.status(HttpStatus.OK)
  }

  @Get('todoist/callback')
  @UseGuards(AuthGuard('todoist'))
  async todoistCallback(@Req() req: Request, @Res() res: Response) {
    res.redirect('/todo/success');
  }

  @Get('success')
  async get() {
    return "success"
  }

  @Post('/sync')
  async handleTodoistWebhook(@Body() payload: any, @Res() res: Response) {
    const task = await this.todoistService.sync(payload)
    res.status(HttpStatus.OK).send(task)
  }
}